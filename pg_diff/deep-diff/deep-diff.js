import diff from "deep-diff";
import fs from "fs";

// Get JsonDiff delta
function readJSONFile(filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, "utf8", (err, data) => {
      if (err) {
        reject(`Error reading file ${filename}: ${err.message}`);
      } else {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (parseError) {
          reject(`Error parsing JSON file ${filename}: ${parseError.message}`);
        }
      }
    });
  });
}

async function readAndCompareJSONFiles() {
  try {
   // const oldDatabaseConfig = await readJSONFile("../alt_1.json");
  //  const newDatabaseConfig = await readJSONFile("../alt_3.json");

     const oldDatabaseConfig = await readJSONFile("../alt_3.json");
     const newDatabaseConfig = await readJSONFile("../alt_2.json");
    var differences = diff(oldDatabaseConfig, newDatabaseConfig);
   
    const data = JSON.stringify(differences);

    console.log(data);
    
  } catch (error) {
    console.error("Error reading or parsing JSON files:", error);
  }
}

readAndCompareJSONFiles();


