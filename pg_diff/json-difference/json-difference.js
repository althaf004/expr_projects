import { getDiff } from "json-difference";
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
    const oldDatabaseConfig = await readJSONFile("../alt_3.json");
    const newDatabaseConfig = await readJSONFile("../alt_2.json");

    // const oldDatabaseConfig = await readJSONFile("alt_4.json");
    // const newDatabaseConfig = await readJSONFile("alt_2.json");

    const diff = getDiff(oldDatabaseConfig, newDatabaseConfig);
    const diff2 = getDiff(oldDatabaseConfig, newDatabaseConfig, { isLodashLike: true });
    const data = JSON.stringify(diff);
    const data2 = JSON.stringify(diff2);
    //const jsonString = JSON.stringify(diff, null, 2);
    console.log(data);
    //console.log(data2);
    
  } catch (error) {
    console.error("Error reading or parsing JSON files:", error);
  }
}

readAndCompareJSONFiles();


