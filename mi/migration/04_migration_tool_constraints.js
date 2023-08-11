const fs = require('fs');
const { Client } = require('pg');

const dbConfig = require('./db_config');

const sourceConfig = dbConfig.sourceConfig;
const targetConfig = dbConfig.targetConfig;

const sourceClient = new Client(sourceConfig);
const targetClient = new Client(targetConfig);

async function main() {
  try {
    await sourceClient.connect();
    await targetClient.connect();

    const sourceSchemaQuery = `
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name NOT LIKE 'pg_%' AND schema_name != 'information_schema';
    `;

    const targetSchemaQuery = `
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name NOT LIKE 'pg_%' AND schema_name != 'information_schema';
    `;

    const sourceSchemaResult = await sourceClient.query(sourceSchemaQuery);
    const targetSchemaResult = await targetClient.query(targetSchemaQuery);

    const sourceSchemas = sourceSchemaResult.rows.map(row => row.schema_name);
    const targetSchemas = targetSchemaResult.rows.map(row => row.schema_name);

    const alterTableScripts = [];
    const constraintScripts = new Set();

    for (const schema of sourceSchemas) {
      if (targetSchemas.includes(schema)) {
        const tableQuery = `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = '${schema}'
            AND table_type = 'BASE TABLE';
        `;

        const tableResult = await sourceClient.query(tableQuery);
        const tables = tableResult.rows.map(row => row.table_name);

        for (const sourceTable of tables) {
          const targetTableQuery = `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = '${schema}'
              AND table_name = '${sourceTable}'
              AND table_type = 'BASE TABLE';
          `;

          const targetTableResult = await targetClient.query(targetTableQuery);
          const targetTable = targetTableResult.rows[0];

          if (targetTable) {
            const sourceColumnQuery = `
              SELECT column_name
              FROM information_schema.columns
              WHERE table_schema = '${schema}'
                AND table_name = '${sourceTable}'
                ORDER BY ordinal_position;
            `;

            const targetColumnQuery = `
              SELECT column_name
              FROM information_schema.columns
              WHERE table_schema = '${schema}'
                AND table_name = '${sourceTable}'
                ORDER BY ordinal_position;
            `;

            const sourceColumnResult = await sourceClient.query(sourceColumnQuery);
            const targetColumnResult = await targetClient.query(targetColumnQuery);

            const sourceColumns = sourceColumnResult.rows.map(row => row.column_name);
            const targetColumns = targetColumnResult.rows.map(row => row.column_name);

            const missingColumns = sourceColumns.filter(col => !targetColumns.includes(col));

            if (missingColumns.length > 0) {
              const alterTableScript = `ALTER TABLE ${schema}.${sourceTable} ADD COLUMN ${getColumnsDefinition(missingColumns)};`;
              if (!alterTableScripts.includes(alterTableScript)) {
                alterTableScripts.push(alterTableScript);
              }
            }

            const constraintsQuery = `
              SELECT
                tc.constraint_name,
                tc.constraint_type,
                kcu.column_name,
                ccu.table_schema AS foreign_table_schema,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
              FROM
                information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
              WHERE
                tc.table_schema = '${schema}'
                AND tc.table_name = '${sourceTable}'
                AND tc.constraint_type != 'CHECK';
            `;

            const constraintResult = await sourceClient.query(constraintsQuery);
            const constraints = constraintResult.rows;

            if (constraints.length > 0) {
              const constraintScript = getConstraintScript(schema, sourceTable, constraints);
              constraintScripts.add(constraintScript);
            }
          }
        }
      }
    }

    const migrationScript = [...alterTableScripts, ...constraintScripts].join('\n');
    fs.writeFileSync('03_migration_script.sql', migrationScript);

    console.log('Migration script for missing columns and constraints generated successfully.');
  } catch (error) {
    console.error('Error occurred during migration script generation:', error);
  } finally {
    await sourceClient.end();
    await targetClient.end();
  }
}

function getColumnsDefinition(columns) {
  return columns.map(column => {
    let columnDefinition = `${column} VARCHAR(255)`; // Replace VARCHAR(255) with the appropriate data type from the source database.
    return columnDefinition;
  }).join(', ');
}
function formatPrimaryKeys(primaryKeys) {
  // Filter out duplicate columns, if any
  const uniquePrimaryKeys = [...new Set(primaryKeys)];
  return `PRIMARY KEY (${uniquePrimaryKeys.join(', ')})`;
}

function getConstraintScript(schema, table, constraints) {
  const constraintScripts = [];
  const primaryKeys = [];

  for (const constraint of constraints) {
    switch (constraint.constraint_type) {
      case 'PRIMARY KEY':
        primaryKeys.push(constraint.column_name);
        break;
      case 'FOREIGN KEY':
        constraintScripts.push(`ALTER TABLE ${schema}.${table} ADD CONSTRAINT ${constraint.constraint_name} FOREIGN KEY (${constraint.column_name}) REFERENCES ${constraint.foreign_table_schema}.${constraint.foreign_table_name} (${constraint.foreign_column_name});`);
        break;
      case 'UNIQUE':
        constraintScripts.push(`ALTER TABLE ${schema}.${table} ADD CONSTRAINT ${constraint.constraint_name} UNIQUE (${constraint.column_name});`);
        break;
      case 'CHECK':
        constraintScripts.push(`ALTER TABLE ${schema}.${table} ADD CONSTRAINT ${constraint.constraint_name} CHECK (${constraint.check_clause});`);
        break;
      case 'INDEX': // Handle INDEX constraint
        constraintScripts.push(`CREATE INDEX ${constraint.constraint_name} ON ${schema}.${table} (${constraint.column_name});`);
        break;
      default:
        // Handle other constraint types here if needed.
        break;
    }
  }

  if (primaryKeys.length > 0) {
    const primaryKeyScript = formatPrimaryKeys(primaryKeys);
    constraintScripts.push(`ALTER TABLE ${schema}.${table} ADD CONSTRAINT ${primaryKeyScript};`);
  }

  return constraintScripts.join('\n');
}

main();
