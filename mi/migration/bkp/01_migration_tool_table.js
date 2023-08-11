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

    const tableScripts = [];

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

        if (!targetTable) {
          const columnsQuery = `
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_schema = '${schema}'
              AND table_name = '${table}'
            ORDER BY ordinal_position;
          `;

          const columnsResult = await sourceClient.query(columnsQuery);
          const columns = columnsResult.rows.map(column => {
            let columnDefinition = `${column.column_name} ${column.data_type}`;
            if (column.character_maximum_length) {
              columnDefinition += `(${column.character_maximum_length})`;
            }
            return columnDefinition;
          });

          const createTableScript = `CREATE TABLE ${schema}.${table} (\n  ${columns.join(',\n  ')}\n);`;
          tableScripts.push(createTableScript);
        }
      }
    }

    const migrationScript = tableScripts.join('\n\n');
    fs.writeFileSync('01_table_script.sql', migrationScript);

    console.log('Table migration script generated successfully.');
  } catch (error) {
    console.error('Error occurred during table migration script generation:', error);
  } finally {
    await sourceClient.end();
    await targetClient.end();
  }
}

main();
