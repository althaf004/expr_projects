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

    const functionScripts = [];

    for (const schema of schemas) {
      const functionQuery = `
        SELECT routine_name
        FROM information_schema.routines
        WHERE specific_schema = '${schema}'
          AND routine_type = 'FUNCTION';
      `;

      const functionResult = await sourceClient.query(functionQuery);
      const functions = functionResult.rows.map(row => row.routine_name);

      for (const func of functions) {
        const sourceFunctionQuery = `
          SELECT pg_get_functiondef(p.oid)
          FROM pg_catalog.pg_proc p
          JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
          WHERE n.nspname = '${schema}'
            AND p.proname = '${func}';
        `;

        const targetFunctionQuery = `
          SELECT pg_get_functiondef(p.oid)
          FROM pg_catalog.pg_proc p
          JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
          WHERE n.nspname = '${schema}'
            AND p.proname = '${func}';
        `;

        const sourceFunctionResult = await sourceClient.query(sourceFunctionQuery);
        const targetFunctionResult = await targetClient.query(targetFunctionQuery);

        const sourceFunctionDefinition = sourceFunctionResult.rows[0]?.pg_get_functiondef;
        const targetFunctionDefinition = targetFunctionResult.rows[0]?.pg_get_functiondef;

        if (sourceFunctionDefinition !== targetFunctionDefinition) {
          // Drop the existing function before creating it
          const dropFunctionScript = `DROP FUNCTION IF EXISTS ${schema}.${func};`;
          functionScripts.push(dropFunctionScript);

          const createFunctionScript = `${sourceFunctionDefinition}`;
          functionScripts.push(createFunctionScript);
        }
      }
    }

    const migrationScript = functionScripts.join('\n\n');
    fs.writeFileSync('05_function_migration.sql', migrationScript);

    // const migrationScript = functionScripts.join('\n\n');
    // const existingScript = fs.readFileSync('migration_script.sql', 'utf8');
    // const mergedScript = `${existingScript}\n\n${migrationScript}`;

    console.log('Function migration script generated successfully.');
  } catch (error) {
    console.error('Error occurred during function migration script generation:', error);
  } finally {
    await sourceClient.end();
    await targetClient.end();
  }
}

main();
