const fs = require('fs');

// Function to read and parse JSON files
function readJSONFile(filename) {
  const data = fs.readFileSync(filename, 'utf8');
  return JSON.parse(data);
}

// Function to compare two JSON objects and generate a diff object
function compareJSONObjects(obj1, obj2) {
  const diff = {};

  for (const key in obj1) {
    if (obj1.hasOwnProperty(key) && !obj2.hasOwnProperty(key)) {
      console.log(`Key '${key}' is present in JSON object 1 but not in JSON object 2`);
      diff[key] = { new: obj1[key] };
    } else if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
      const nestedDiff = compareJSONObjects(obj1[key], obj2[key]);
      if (Object.keys(nestedDiff).length > 0) {
        diff[key] = nestedDiff;
      }
    } else if (obj1[key] !== obj2[key]) {
      console.log(`Value mismatch for key '${key}':`);
      console.log(`JSON object 1: ${JSON.stringify(obj1[key])}`);
      console.log(`JSON object 2: ${JSON.stringify(obj2[key])}`);
      diff[key] = { modified: obj2[key] };
    }
  }

  for (const key in obj2) {
    if (obj2.hasOwnProperty(key) && !obj1.hasOwnProperty(key)) {
      console.log(`Key '${key}' is present in JSON object 2 but not in JSON object 1`);
      diff[key] = { deleted: true };
    }
  }

  return diff;
}

// Function to generate migration script based on differences
// Function to generate migration script based on differences
function generateMigrationScript(diff) {
  let migrationScript = '';

  // Helper function to generate SQL statements for columns
  function generateColumnSQL(columnName, columnDetails) {
    const dataType = columnDetails.data_type;
    const isNullable = columnDetails.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
    const maxLength = columnDetails.character_maximum_length
      ? `(${columnDetails.character_maximum_length})`
      : '';
    const defaultValue = columnDetails.column_default
      ? `DEFAULT ${columnDetails.column_default}`
      : '';
    return `${columnName} ${dataType}${maxLength} ${isNullable} ${defaultValue}`;
  }

  // Helper function to generate SQL statements for indexes
  function generateIndexSQL(indexName, indexDetails) {
    const columns = indexDetails.index_columns.join(', ');
    const unique = indexDetails.is_unique ? 'UNIQUE' : '';
    const primaryKey = indexDetails.is_primary ? 'PRIMARY KEY' : '';
    return `CREATE ${unique} ${primaryKey} INDEX ${indexName} ON ${indexDetails.table_name} (${columns});`;
  }

  // Helper function to generate SQL statements for foreign keys
  function generateForeignKeySQL(fkName, fkDetails) {
    const columns = fkDetails.columns.join(', ');
    return `ALTER TABLE ${fkDetails.table_name} ADD CONSTRAINT ${fkName} FOREIGN KEY (${columns}) 
            REFERENCES ${fkDetails.foreign_table_name} (${columns});`;
  }

  // Iterate through the differences and generate the migration script
  for (const tableName in diff) {
    if (diff.hasOwnProperty(tableName)) {
      const tableDiff = diff[tableName];

      if (tableDiff.new) {
        // Table is new, create it
        migrationScript += `CREATE TABLE ${tableName} (\n`;
        for (const columnName in tableDiff.new) {
          if (tableDiff.new.hasOwnProperty(columnName)) {
            migrationScript += `  ${generateColumnSQL(columnName, tableDiff.new[columnName])},\n`;
          }
        }
        migrationScript += ');\n\n';
      }

      if (tableDiff.modified) {
        // Table is modified, alter it
        for (const columnName in tableDiff.modified) {
          if (tableDiff.modified.hasOwnProperty(columnName)) {
            migrationScript += `ALTER TABLE ${tableName} ALTER COLUMN ${generateColumnSQL(
              columnName,
              tableDiff.modified[columnName]
            )};\n`;
          }
        }
      }

      if (tableDiff.deleted) {
        // Table is deleted, drop it
        migrationScript += `DROP TABLE ${tableName};\n\n`;
      }

      if (tableDiff.indexes) {
        // Table has new indexes, create them
        for (const indexName in tableDiff.indexes) {
          if (tableDiff.indexes.hasOwnProperty(indexName)) {
            migrationScript += generateIndexSQL(indexName, tableDiff.indexes[indexName]);
          }
        }
      }

      if (tableDiff.constraints) {
        // Table has new constraints, create them
        for (const constraintName in tableDiff.constraints) {
          if (tableDiff.constraints.hasOwnProperty(constraintName)) {
            migrationScript += generateForeignKeySQL(constraintName, tableDiff.constraints[constraintName]);
          }
        }
      }
    }
  }

  return migrationScript;
}


// Main function
function main() {
  try {
    const jsonFile1 = '02.json';
    const jsonFile2 = '04.json';

    // Read and parse the JSON files
    const json1 = readJSONFile(jsonFile1);
    const json2 = readJSONFile(jsonFile2);

    // Compare the two JSON objects and get the diff object
    const diff = compareJSONObjects(json1, json2);

    // Generate migration script based on identified differences
    const migrationScript = generateMigrationScript(diff);
    console.log('Migration Script:');
    console.log(migrationScript);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();

