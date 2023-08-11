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

    const missingSchemas = sourceSchemas.filter(schema => !targetSchemas.includes(schema));

    const schemaScripts = [];

    for (const schema of missingSchemas) {
      const createSchemaScript = `CREATE SCHEMA ${schema};`;
      schemaScripts.push(createSchemaScript);
    }

    const schemaMigrationScript = schemaScripts.join('\n');
    fs.writeFileSync('00_schema_script.sql', schemaMigrationScript);

    const tableScripts = [];
    const alterTableScripts = [];
    const alterTableScripts1 = [];
    const constraintScripts = new Set();

    for (const schema of sourceSchemas) {
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

        if (!targetTable) {
          const columnsQuery = `
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_schema = '${schema}'
              AND table_name = '${sourceTable}'
            ORDER BY ordinal_position;
          `;

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

          const checkConstraintsQuery = `
            SELECT tc.table_schema,
              tc.table_name,
              string_agg(col.column_name, ', ') as columns,
              tc.constraint_name,
              cc.check_clause
            FROM information_schema.table_constraints tc
            JOIN information_schema.check_constraints cc
              ON tc.constraint_schema = cc.constraint_schema
              AND tc.constraint_name = cc.constraint_name
            JOIN pg_namespace nsp ON nsp.nspname = cc.constraint_schema
            JOIN pg_constraint pgc ON pgc.conname = cc.constraint_name
              AND pgc.connamespace = nsp.oid
              AND pgc.contype = 'c'
            JOIN information_schema.columns col
              ON col.table_schema = tc.table_schema
              AND col.table_name = tc.table_name
              AND col.ordinal_position = ANY(pgc.conkey)
            WHERE tc.table_schema = '${schema}'
              AND tc.table_name = '${sourceTable}'
              AND tc.constraint_schema NOT IN ('pg_catalog', 'information_schema')
            GROUP BY tc.table_schema,
              tc.table_name,
              tc.constraint_name,
              cc.check_clause;
          `;

          const columnsResult = await sourceClient.query(columnsQuery);
          const columns = columnsResult.rows.map(column => {
            let columnDefinition = `${column.column_name} ${column.data_type}`;
            if (column.character_maximum_length) {
              columnDefinition += `(${column.character_maximum_length})`;
            }
            return columnDefinition;
          });

          const constraintsResult = await sourceClient.query(constraintsQuery);
          const constraints = constraintsResult.rows.map(constraint => {
          if (constraint.constraint_type === 'PRIMARY KEY') {
            return `PRIMARY KEY (${constraint.column_name})`;
          } else if (constraint.constraint_type === 'FOREIGN KEY') {
            return `FOREIGN KEY (${constraint.column_name}) REFERENCES ${constraint.foreign_table_schema}.${constraint.foreign_table_name} (${constraint.foreign_column_name})`;
          } else if (constraint.constraint_type === 'UNIQUE') {
            return `UNIQUE (${constraint.column_name})`;
          }
        });

      const checkConstraintsResult = await sourceClient.query(checkConstraintsQuery);
      const checkConstraints = checkConstraintsResult.rows.map(constraint => {
        return `CHECK (${constraint.columns} ${constraint.check_clause})`;
      });

      const uniqueConstraints = new Set([...constraints, ...checkConstraints]);
      const createTableScriptParts = [`CREATE TABLE ${schema}.${sourceTable} (\n  ${columns.join(',\n  ')}`];
      if (uniqueConstraints.size > 0) {
        createTableScriptParts.push(`,\n  ${[...uniqueConstraints].join(',\n  ')}`);
      }
      createTableScriptParts.push(`\n);`);
      const createTableScript = createTableScriptParts.join('');
      tableScripts.push(createTableScript);
      }
        
      if (targetTable) {
          const sourceColumnsQuery = `
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_schema = '${schema}'
              AND table_name = '${sourceTable}'
            ORDER BY ordinal_position;
          `;

          const targetColumnsQuery = `
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_schema = '${schema}'
              AND table_name = '${sourceTable}'
            ORDER BY ordinal_position;
          `;

          const sourceColumnsResult = await sourceClient.query(sourceColumnsQuery);
          const targetColumnsResult = await targetClient.query(targetColumnsQuery);

          const sourceColumns = sourceColumnsResult.rows;
          const targetColumns = targetColumnsResult.rows;

          const alterColumns = [];

          for (const sourceColumn of sourceColumns) {
            const targetColumn = targetColumns.find(col => col.column_name === sourceColumn.column_name);

            if (!targetColumn) {
              alterColumns.push(`ADD COLUMN ${sourceColumn.column_name} ${sourceColumn.data_type}${sourceColumn.character_maximum_length ? `(${sourceColumn.character_maximum_length})` : ''}`);
            } else if (
              sourceColumn.data_type !== targetColumn.data_type ||
              sourceColumn.character_maximum_length !== targetColumn.character_maximum_length
            ) {
              alterColumns.push(`ALTER COLUMN ${sourceColumn.column_name} TYPE ${sourceColumn.data_type}${sourceColumn.character_maximum_length ? `(${sourceColumn.character_maximum_length})` : ''}`);
            }
          }

          if (alterColumns.length > 0) {
            const alterTableScript = `ALTER TABLE ${schema}.${sourceTable} ${alterColumns.join(', ')};`;
            if (!alterTableScripts.includes(alterTableScript)) {
              alterTableScripts.push(alterTableScript);
            }
           // alterTableScripts.push(alterTableScript);
          }
        }

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
            const alterTableScript1 = `ALTER TABLE ${schema}.${sourceTable} ADD COLUMN ${getColumnsDefinition(missingColumns)};`;
            if (!alterTableScripts1.includes(alterTableScript1)) {
              alterTableScripts1.push(alterTableScript1);
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


          const checkConstraintsQuery = `
            SELECT tc.table_schema,
              tc.table_name,
              string_agg(col.column_name, ', ') as columns,
              tc.constraint_name,
              cc.check_clause,'CHECK' as constraint_type
            FROM information_schema.table_constraints tc
            JOIN information_schema.check_constraints cc
              ON tc.constraint_schema = cc.constraint_schema
              AND tc.constraint_name = cc.constraint_name
            JOIN pg_namespace nsp ON nsp.nspname = cc.constraint_schema
            JOIN pg_constraint pgc ON pgc.conname = cc.constraint_name
              AND pgc.connamespace = nsp.oid
              AND pgc.contype = 'c'
            JOIN information_schema.columns col
              ON col.table_schema = tc.table_schema
              AND col.table_name = tc.table_name
              AND col.ordinal_position = ANY(pgc.conkey)
            WHERE tc.table_schema = '${schema}'
              AND tc.table_name = '${sourceTable}'
              AND tc.constraint_schema NOT IN ('pg_catalog', 'information_schema')
            GROUP BY tc.table_schema,
              tc.table_name,
              tc.constraint_name,
              cc.check_clause;
            `;

    const checkConstraintsResult = await sourceClient.query(checkConstraintsQuery);
    const checkConstraints = checkConstraintsResult.rows;

    if (checkConstraints.length > 0) {
      const existingCheckConstraintsQuery = `
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_schema = '${schema}'
          AND table_name = '${sourceTable}'
          AND constraint_name = ANY(ARRAY[${checkConstraints.map(constraint => `'${constraint.constraint_name}'`).join(',')}]);
      `;

      const existingCheckConstraintResult = await targetClient.query(existingCheckConstraintsQuery);
      const existingCheckConstraints = existingCheckConstraintResult.rows.map(row => row.constraint_name);
//console.log(existingCheckConstraints)
      for (const checkConstraint of checkConstraints) {
        // Check if the check constraint does not exist in the target database
        if (!existingCheckConstraints.includes(checkConstraint.constraint_name)) {
          const constraintScript = getConstraintScript(schema, sourceTable, [checkConstraint]);
          constraintScripts.add(constraintScript);
        }
      }
    }





    // if (checkconstraints.length > 0) {
    //   const constraintScript = getConstraintScript(schema, sourceTable, checkconstraints);     
    //   constraintScripts.add(constraintScript);
    // }   

      }
    }



    const migrationScript = tableScripts.join('\n\n');
    fs.writeFileSync('01_table_script.sql', migrationScript);
    const migrationScript1 = alterTableScripts.join('\n\n');
    fs.writeFileSync('02_migration_script.sql', migrationScript1);

    const migrationScript2 = [...alterTableScripts1, ...constraintScripts].join('\n');
    fs.writeFileSync('03_migration_script.sql', migrationScript2);

    console.log('Schema and table migration scripts generated successfully.');
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
//console.log(schema, table, constraints)
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
        constraintScripts.push(`CREATE INDEX ${constraint.constraint_name} ON ${schema}.${table} (${constraint});`);

        //CREATE  INDEX title_idx ON films (title);
        break;
      default:
      
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
