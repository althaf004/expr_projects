const fs = require('fs');
const { Client } = require('pg');
const dbConfig = require('../db_config');

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

    const viewScripts = [];

    for (const schema of schemas) {
      const viewQuery = `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = '${schema}'
          AND table_type = 'VIEW';
      `;

      const viewResult = await sourceClient.query(viewQuery);
      const views = viewResult.rows.map(row => row.table_name);

      for (const view of views) {
        const sourceViewQuery = `
          SELECT view_definition
          FROM information_schema.views
          WHERE table_schema = '${schema}'
            AND table_name = '${view}';
        `;

        const targetViewQuery = `
          SELECT view_definition
          FROM information_schema.views
          WHERE table_schema = '${schema}'
            AND table_name = '${view}';
        `;

        const sourceViewResult = await sourceClient.query(sourceViewQuery);
        const targetViewResult = await targetClient.query(targetViewQuery);

        const sourceViewDefinition = sourceViewResult.rows[0]?.view_definition;
        const targetViewDefinition = targetViewResult.rows[0]?.view_definition;

        if (sourceViewDefinition !== targetViewDefinition) {
          // Drop the existing view before creating it
          const dropViewScript = `DROP VIEW IF EXISTS ${schema}.${view};`;
          viewScripts.push(dropViewScript);

          const createViewScript = `CREATE OR REPLACE VIEW ${schema}.${view} AS\n${sourceViewDefinition};`;
          viewScripts.push(createViewScript);
        }
      }
    }

    const migrationScript = viewScripts.join('\n\n');
    fs.writeFileSync('04_view_migration.sql', migrationScript);

    // const migrationScript = viewScripts.join('\n\n');
    // const existingScript = fs.readFileSync('migration_script.sql', 'utf8');
    // const mergedScript = `${existingScript}\n\n${migrationScript}`;

    console.log('View migration script generated successfully.');
  } catch (error) {
    console.error('Error occurred during view migration script generation:', error);
  } finally {
    await sourceClient.end();
    await targetClient.end();
  }
}

main();
