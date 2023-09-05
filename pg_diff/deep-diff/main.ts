import * as fs from 'fs';

interface JsonDifference {
  kind: string;
  path: string[];
  lhs?: any;
  rhs?: any;
}

function generateMigrationScript(differences: JsonDifference[]): string {
    let migrationScript = '';
  
    for (const diff of differences) {
      const { kind, path, lhs, rhs } = diff;
      const fullPath = path.join('.');
  
      switch (kind) {
        case 'E':
          // Handle modifications (e.g., column data type changes)
          if (path.includes('columns') && lhs !== undefined && rhs !== undefined) {
            migrationScript += `ALTER TABLE "${path[5]}" ALTER COLUMN "${path[7]}" TYPE ${rhs};\n`;
          }
          break;
        case 'D':
          // Handle deletions (e.g., dropping tables)
          if (path.includes('tables')) {
            migrationScript += `DROP TABLE IF EXISTS "${path[5]}";\n`;
          }
          break;
        case 'N':
          // Handle additions (e.g., creating tables)
          if (path.includes('tables')) {
            const tableName = path[5];
            migrationScript += `CREATE TABLE IF NOT EXISTS "${tableName}" (\n`;
            const columns = rhs.columns;
            if (columns) {
              const columnDefs: string[] = [];
              for (const colName of Object.keys(columns)) {
                const col = columns[colName];
                columnDefs.push(`"${colName}" ${col.data_type}`);
              }
              migrationScript += columnDefs.join(',\n');
            }
            migrationScript += '\n);\n';
          }
          break;
        default:
          // Handle other types of differences as needed
          break;
      }
    }
  
    return migrationScript;
  }

function readJsonFile(filePath: string): JsonDifference[] {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading JSON file: ${error.message}`);
    return [];
  }
}

// Specify the path to your JSON differences file
const jsonFilePath = 'deep-diff.json';

// Read the JSON differences from the file
const jsonDifferences = readJsonFile(jsonFilePath);

// Generate the migration script
const migrationScript = generateMigrationScript(jsonDifferences);

// Output the migration script
console.log(migrationScript);
