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
          const sourceColumnsQuery = `
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_schema = '${schema}'
              AND table_name = '${table}'
            ORDER BY ordinal_position;
          `;

          const targetColumnsQuery = `
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_schema = '${schema}'
              AND table_name = '${table}'
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
            const alterTableScript = `ALTER TABLE ${schema}.${table} ${alterColumns.join(', ')};`;
            alterTableScripts.push(alterTableScript);
          }
        }
      }
    }

    const migrationScript = alterTableScripts.join('\n\n');
    fs.writeFileSync('02_migration_script.sql', migrationScript);


    // const migrationScript = alterTableScripts.join('\n\n');
    // const existingScript = fs.readFileSync('migration_script.sql', 'utf8');
    // const mergedScript = `${existingScript}\n\n${migrationScript}`;


    console.log('Table migration script generated successfully.');
  } catch (error) {
    console.error('Error occurred during table migration script generation:', error);
  } finally {
    await sourceClient.end();
    await targetClient.end();
  }
}

main();
