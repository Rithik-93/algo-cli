const fs = require('fs');
const path = require('path');

function processProblemsDirectory(problemsDir) {
  fs.readdirSync(problemsDir).forEach(problemSlug => {
    const problemDir = path.join(problemsDir, problemSlug);

    // Check if it's a directory
    if (fs.lstatSync(problemDir).isDirectory()) {
      const jsonFileName = `${problemSlug}.json`;
      const jsonFilePath = path.join(problemDir, 'tests', jsonFileName);

      if (fs.existsSync(jsonFilePath)) {
        console.log(`Processing ${jsonFilePath}...`);
        try {
          splitJsonToInputOutput(jsonFilePath);
        } catch (error) {
          console.error(`Error processing ${jsonFilePath}:`, error);
        }
      } else {
        console.warn(`JSON file not found for ${problemSlug}: ${jsonFilePath}`);
        // Continue to the next directory without failing
      }
    }
  });
}

function splitJsonToInputOutput(jsonFilePath) {
  const jsonData = fs.readFileSync(jsonFilePath, 'utf8');
  const testCases = JSON.parse(jsonData);

  const problemDir = path.dirname(jsonFilePath);
  const inputDir = path.join(problemDir, 'inputs');
  const outputDir = path.join(problemDir, 'outputs');

  // Create or clear the inputs directory
  if (fs.existsSync(inputDir)) {
    fs.rmSync(inputDir, { recursive: true, force: true });
  }
  fs.mkdirSync(inputDir, { recursive: true });

  // Create or clear the outputs directory
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outputDir, { recursive: true });

  testCases.forEach((testCase, index) => {
    const inputFilePath = path.join(inputDir, `${index}.txt`);
    const outputFilePath = path.join(outputDir, `${index}.txt`);

    const inputContent = convertToPlainText(testCase.input);
    fs.writeFileSync(inputFilePath, inputContent, 'utf8');

    const outputContent = convertToPlainText(testCase.output);
    fs.writeFileSync(outputFilePath, outputContent, 'utf8');
  });

  console.log(`Successfully processed ${jsonFilePath}`);
}

function convertToPlainText(obj) {
  let result = '';

  // Check if the value is an array using regex
  const isArray = (value) => {
    return Array.isArray(value) || (typeof value === 'string' && /^\[.*\]$/.test(value.trim()));
  };

  // Function to handle the output based on the type of object
  const processValue = (value) => {
    if (typeof value === 'number' || typeof value === 'boolean' || (typeof value === 'string' && !isArray(value))) {
      // Scalar value (number, boolean, or non-array string)
      return value.toString() + '\n';
    } else if (isArray(value)) {
      // Convert a string representation of an array to a JavaScript array if needed
      const array = Array.isArray(value) ? value : JSON.parse(value);
      if (Array.isArray(array[0])) {
        // 2D array
        const rows = array.length;
        const cols = array[0].length;
        let arrayResult = `${rows} ${cols}\n`;
        array.forEach(row => {
          arrayResult += row.map(el => el.toString()).join(' ') + '\n';
        });
        return arrayResult.trim() + '\n';
      } else {
        // 1D array
        const length = array.length;
        return `${length}\n${array.map(el => el.toString()).join(' ')}\n`;
      }
    } else {
      // For objects, treat each key-value pair line by line
      let objectResult = '';
      for (const key of Object.keys(value)) {
        objectResult += processValue(value[key]);
      }
      return objectResult.trim() + '\n';
    }
  };

  result += processValue(obj);

  return result.trim();
}

module.exports = processProblemsDirectory;
