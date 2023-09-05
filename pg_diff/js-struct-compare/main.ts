import * as fs from 'fs';

// Define the file path to your JSON data
const jsonFilePath = 'js-struct-compare-complex.json';

// Define the interface for the JSON data structure
interface DatabaseDifference {
  path: string[];
  type: string;
  left_value?: any;
  right_value?: any;
}

// Function to generate SQL for table creation
function generateTableSql(tableName: string, columns: any): string {
  const columnDefinitions = Object.keys(columns)
    .map((columnName) => {
      const column = columns[columnName];
      const dataType = column.data_type;
      const isNullable = column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultValue = column.default_value
        ? `DEFAULT ${column.default_value}`
        : '';
      return `${columnName} ${dataType} ${isNullable} ${defaultValue}`;
    })
    .join(',\n  ');

  return `CREATE TABLE ${tableName} (\n  ${columnDefinitions}\n);`;
}

// Function to generate SQL for table alteration
function generateTableAlterSql(tableName: string, alterationType: string, data: any): string {
  if (alterationType === 'deleted') {
    return `DROP TABLE ${tableName};`;
  } else if (alterationType === 'added') {
    return generateTableSql(tableName, data.columns);
  } else if (alterationType === 'changed') {
    // You can handle changes as needed
    // For example, ALTER TABLE statements
    return `ALTER TABLE ${tableName} ...;`;
  }
  return '';
}

// Function to generate SQL for views
function generateViewSql(viewName: string, definition: any): string {
  return `CREATE OR REPLACE VIEW ${viewName} AS\n${definition.definition};`;
}

// Function to generate SQL based on the differences
function generateSqlFromDifferences(differences: DatabaseDifference[]): string {
  const sqlStatements: string[] = [];

  differences.forEach((difference) => {
    const path = difference.path;
    const tableName = path[path.length - 1]; // Last element in path is the table/view name

    if (path.includes('views')) {
      // If the path includes 'views', it's a view definition
      sqlStatements.push(generateViewSql(tableName, difference.right_value));
    } else if (path.includes('tables')) {
      // If the path includes 'tables', it's a table definition or alteration
      if (difference.type === 'deleted' || difference.type === 'added') {
        sqlStatements.push(generateTableAlterSql(tableName, difference.type, difference.right_value));
      } else if (difference.type === 'changed') {
        // You can handle changes as needed
        // For example, ALTER TABLE statements
        sqlStatements.push(generateTableAlterSql(tableName, difference.type, difference.right_value));
      }
    }
  });

  return sqlStatements.join('\n\n');
}

// Read JSON data from the file
fs.readFile(jsonFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error(`Error reading JSON file: ${err.message}`);
    process.exit(1);
  }

  // Parse the JSON data
  const differences: DatabaseDifference[] = JSON.parse(data);

  // Generate SQL script from the differences
  const sqlScript = generateSqlFromDifferences(differences);

  // Print the generated SQL script
  console.log(sqlScript);
});
