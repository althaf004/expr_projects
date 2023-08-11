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

    const schemaQuery = `
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name NOT LIKE 'pg_%' AND schema_name != 'information_schema';
    `;

    const schemaResult = await sourceClient.query(schemaQuery);
    const schemas = schemaResult.rows.map(row => row.schema_name);

    const alterTableScripts = [];

    for (const schema of schemas) {
      const tableQuery = `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = '${schema}'
          AND table_type = 'BASE TABLE';
      `;

      const tableResult = await sourceClient.query(tableQuery);
      const tables = tableResult.rows.map(row => row.table_name);

      for (const table of tables) {
        const targetTableQuery = `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = '${schema}'
            AND table_name = '${table}'
            AND table_type = 'BASE TABLE';
        `;

        const targetTableResult = await targetClient.query(targetTableQuery);
        const targetTable = targetTableResult.rows[0];

        if (targetTable) {
          // Generate ALTER TABLE statements for adding missing primary keys
          const primaryKeyQuery = `
            SELECT constraint_name, string_agg(column_name, ', ') AS columns
            FROM information_schema.key_column_usage
            WHERE constraint_catalog = '${dbConfig.sourceConfig.database}'
              AND constraint_schema = '${schema}'
              AND table_name = '${table}'
              AND constraint_name = (
                SELECT constraint_name
                FROM information_schema.table_constraints
                WHERE constraint_catalog = '${dbConfig.sourceConfig.database}'
                  AND constraint_schema = '${schema}'
                  AND table_name = '${table}'
                  AND constraint_type = 'PRIMARY KEY'
                LIMIT 1
              )
            GROUP BY constraint_name;
          `;

          const primaryKeyResult = await sourceClient.query(primaryKeyQuery);
          const primaryKey = primaryKeyResult.rows[0]?.columns;

          if (primaryKey) {
            const alterTableScript = `ALTER TABLE ${schema}.${table} ADD PRIMARY KEY (${primaryKey});`;
            alterTableScripts.push(alterTableScript);
          } else {
            const missingPrimaryKeyQuery = `
              SELECT column_name
              FROM information_schema.columns
              WHERE table_schema = '${schema}'
                AND table_name = '${table}'
                AND is_nullable = 'NO'
              ORDER BY ordinal_position;
            `;

            const missingPrimaryKeyResult = await sourceClient.query(missingPrimaryKeyQuery);
            const missingPrimaryKeyColumns = missingPrimaryKeyResult.rows.map(row => row.column_name);

            if (missingPrimaryKeyColumns.length > 0) {
              const missingPrimaryKeyScript = `ALTER TABLE ${schema}.${table} ADD PRIMARY KEY (${missingPrimaryKeyColumns.join(', ')});`;
              alterTableScripts.push(missingPrimaryKeyScript);
            }
          }

          // Generate ALTER TABLE statements for adding missing unique constraints
          const uniqueConstraintQuery = `
            SELECT constraint_name, string_agg(column_name, ', ') AS columns
            FROM information_schema.key_column_usage
            WHERE constraint_catalog = '${dbConfig.sourceConfig.database}'
              AND constraint_schema = '${schema}'
              AND table_name = '${table}'
              AND constraint_name NOT IN (
                SELECT constraint_name
                FROM information_schema.table_constraints
                WHERE constraint_catalog = '${dbConfig.sourceConfig.database}'
                  AND constraint_schema = '${schema}'
                  AND table_name = '${table}'
                  AND constraint_type = 'PRIMARY KEY'
              )
              AND constraint_name NOT IN (
                SELECT constraint_name
                FROM information_schema.table_constraints
                WHERE constraint_catalog = '${dbConfig.sourceConfig.database}'
                  AND constraint_schema = '${schema}'
                  AND table_name = '${table}'
                  AND constraint_type = 'FOREIGN KEY'
              )
            GROUP BY constraint_name;
          `;

          const uniqueConstraintResult = await sourceClient.query(uniqueConstraintQuery);

          for (const row of uniqueConstraintResult.rows) {
            const alterTableScript = `ALTER TABLE ${schema}.${table} ADD CONSTRAINT ${row.constraint_name} UNIQUE (${row.columns});`;
            alterTableScripts.push(alterTableScript);
          }

          // Generate ALTER TABLE statements for adding missing foreign keys
          for (const table of tables) {
            // Foreign keys in source database
            const sourceForeignKeyQuery = `
              SELECT conname as constraint_name,
                     conkey as column_ids,
                     confrelid::regclass as referenced_table
              FROM pg_constraint
              WHERE confrelid = '${schema}.${table}'::regclass;
            `;
    
            const sourceForeignKeyResult = await sourceClient.query(sourceForeignKeyQuery);
    
            // Generate CREATE FOREIGN KEY statements for missing foreign keys in the target database
            for (const row of sourceForeignKeyResult.rows) {
              const columnNames = await getColumnNames(sourceClient, schema, table, row.column_ids);
              const referencedTable = row.referenced_table;
    
              // Check if the foreign key constraint already exists in the target database
              const targetForeignKeyQuery = `
                SELECT conname as constraint_name
                FROM pg_constraint
                WHERE confrelid = '${schema}.${table}'::regclass
                  AND conname = '${row.constraint_name}'
              `;
    
              const targetForeignKeyResult = await targetClient.query(targetForeignKeyQuery);
    
              if (targetForeignKeyResult.rows.length === 0) {
                const alterTableScript = `ALTER TABLE ${schema}.${table} ADD CONSTRAINT ${row.constraint_name} FOREIGN KEY (${columnNames}) REFERENCES ${referencedTable};`;
                alterTableScripts.push(alterTableScript);
              }
            }
          }

          // Generate CREATE INDEX statements for missing indexes
          const existingIndexes = new Set();
          for (const table of tables) {
          const sourceIndexQuery = `
          SELECT indexname, indexdef
          FROM pg_indexes
          WHERE schemaname = '${schema}'
            AND tablename = '${table}';
        `;

        const targetIndexQuery = `
          SELECT indexname, indexdef
          FROM pg_indexes
          WHERE schemaname = '${schema}'
            AND tablename = '${table}';
        `;
        const sourceIndexResult = await sourceClient.query(sourceIndexQuery);
        const targetIndexResult = await targetClient.query(targetIndexQuery);

        const sourceIndexes = new Set(sourceIndexResult.rows.map(row => row.indexname));
        const targetIndexes = new Set(targetIndexResult.rows.map(row => row.indexname));

        for (const row of sourceIndexResult.rows) {
          if (!targetIndexes.has(row.indexname) && !existingIndexes.has(row.indexname)) {
            const alterTableScript = `ALTER TABLE ${schema}.${table} ADD ${row.indexdef};`;
            alterTableScripts.push(alterTableScript);
            existingIndexes.add(row.indexname); // Add the index to the set to avoid duplicates
          }
        }
        }
        }
      }
    }
    const uniqueAlterTableScripts = Array.from(new Set(alterTableScripts));

    const migrationScript = uniqueAlterTableScripts.join('\n\n');
    const existingScript = fs.readFileSync('alter_table_migration.sql', 'utf8');
    const mergedScript = `${existingScript}\n\n${migrationScript}`;
    fs.writeFileSync('alter_table_migration.sql', mergedScript);

    console.log('Table migration script generated successfully.');
  } catch (error) {
    console.error('Error occurred during table migration script generation:', error);
  } finally {
    await sourceClient.end();
    await targetClient.end();
  }
}

async function getColumnNames(client, schema, table, columnIds) {
  const columnQuery = `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = '${schema}'
      AND table_name = '${table}'
      AND ordinal_position = ANY ($1::integer[])
    ORDER BY ordinal_position;
  `;

  const values = columnIds.map(id => +id);
  const columnResult = await client.query(columnQuery, [values]);
  return columnResult.rows.map(row => row.column_name).join(', ');
}

async function getTableName(oid, client) {
  const query = `
    SELECT relname
    FROM pg_class
    WHERE oid = ${oid};
  `;

  const result = await client.query(query);
  const tableName = result.rows[0]?.relname;

  return tableName;
}

main();
