"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
// Define the file path to your JSON data
var jsonFilePath = 'js-struct-compare-complex.json';
// Function to generate SQL for table creation
function generateTableSql(tableName, columns) {
    var columnDefinitions = Object.keys(columns)
        .map(function (columnName) {
        var column = columns[columnName];
        var dataType = column.data_type;
        var isNullable = column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        var defaultValue = column.default_value
            ? "DEFAULT ".concat(column.default_value)
            : '';
        return "".concat(columnName, " ").concat(dataType, " ").concat(isNullable, " ").concat(defaultValue);
    })
        .join(',\n  ');
    return "CREATE TABLE ".concat(tableName, " (\n  ").concat(columnDefinitions, "\n);");
}
// Function to generate SQL for table alteration
function generateTableAlterSql(tableName, alterationType, data) {
    if (alterationType === 'deleted') {
        return "DROP TABLE ".concat(tableName, ";");
    }
    else if (alterationType === 'added') {
        return generateTableSql(tableName, data.columns);
    }
    else if (alterationType === 'changed') {
        // You can handle changes as needed
        // For example, ALTER TABLE statements
        return "ALTER TABLE ".concat(tableName, " ...;");
    }
    return '';
}
// Function to generate SQL for views
function generateViewSql(viewName, definition) {
    return "CREATE OR REPLACE VIEW ".concat(viewName, " AS\n").concat(definition.definition, ";");
}
// Function to generate SQL based on the differences
function generateSqlFromDifferences(differences) {
    var sqlStatements = [];
    differences.forEach(function (difference) {
        var path = difference.path;
        var tableName = path[path.length - 1]; // Last element in path is the table/view name
        if (path.includes('views')) {
            // If the path includes 'views', it's a view definition
            sqlStatements.push(generateViewSql(tableName, difference.right_value));
        }
        else if (path.includes('tables')) {
            // If the path includes 'tables', it's a table definition or alteration
            if (difference.type === 'deleted' || difference.type === 'added') {
                sqlStatements.push(generateTableAlterSql(tableName, difference.type, difference.right_value));
            }
            else if (difference.type === 'changed') {
                // You can handle changes as needed
                // For example, ALTER TABLE statements
                sqlStatements.push(generateTableAlterSql(tableName, difference.type, difference.right_value));
            }
        }
    });
    return sqlStatements.join('\n\n');
}
// Read JSON data from the file
fs.readFile(jsonFilePath, 'utf8', function (err, data) {
    if (err) {
        console.error("Error reading JSON file: ".concat(err.message));
        process.exit(1);
    }
    // Parse the JSON data
    var differences = JSON.parse(data);
    // Generate SQL script from the differences
    var sqlScript = generateSqlFromDifferences(differences);
    // Print the generated SQL script
    console.log(sqlScript);
});
