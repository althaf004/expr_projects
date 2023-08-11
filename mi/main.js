const filesToExecute = [
    './01_migration_tool_table.js',
    './02_migration_tool_alter_table.js',
    './03_migration_tool_table_keys.js',
    // './04_migration_tool_views.js',
    // './05_migration_tool_function.js'
  ];
  
  // Execute the files in order
  filesToExecute.forEach(file => {
    require(file);
  });