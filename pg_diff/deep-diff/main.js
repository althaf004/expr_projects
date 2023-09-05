"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
function generateMigrationScript(differences) {
    var migrationScript = '';
    for (var _i = 0, differences_1 = differences; _i < differences_1.length; _i++) {
        var diff = differences_1[_i];
        var kind = diff.kind, path = diff.path, lhs = diff.lhs, rhs = diff.rhs;
        var fullPath = path.join('.');
        switch (kind) {
            case 'E':
                // Handle modifications (e.g., column data type changes)
                if (path.includes('columns') && lhs !== undefined && rhs !== undefined) {
                    migrationScript += "ALTER TABLE \"".concat(path[5], "\" ALTER COLUMN \"").concat(path[7], "\" TYPE ").concat(rhs, ";\n");
                }
                break;
            case 'D':
                // Handle deletions (e.g., dropping tables)
                if (path.includes('tables')) {
                    migrationScript += "DROP TABLE IF EXISTS \"".concat(path[5], "\";\n");
                }
                break;
            case 'N':
                // Handle additions (e.g., creating tables)
                if (path.includes('tables')) {
                    var tableName = path[5];
                    migrationScript += "CREATE TABLE IF NOT EXISTS \"".concat(tableName, "\" (\n");
                    var columns = rhs.columns;
                    if (columns) {
                        var columnDefs = [];
                        for (var _a = 0, _b = Object.keys(columns); _a < _b.length; _a++) {
                            var colName = _b[_a];
                            var col = columns[colName];
                            columnDefs.push("\"".concat(colName, "\" ").concat(col.data_type));
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
function readJsonFile(filePath) {
    try {
        var data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    }
    catch (error) {
        console.error("Error reading JSON file: ".concat(error.message));
        return [];
    }
}
// Specify the path to your JSON differences file
var jsonFilePath = 'deep-diff.json';
// Read the JSON differences from the file
var jsonDifferences = readJsonFile(jsonFilePath);
// Generate the migration script
var migrationScript = generateMigrationScript(jsonDifferences);
// Output the migration script
console.log(migrationScript);
