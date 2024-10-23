const fs = require('fs');
const path = require('path');
const generateTestCases = require('./llm.js');
const { executeJSFile } = require('./execute');
const processProblemsDirectory = require('./convertTests.js');

function extractDescriptionFromFile(problemFolder) {
  const problemMdPath = path.join(problemFolder, 'Problem.md');
  if (fs.existsSync(problemMdPath)) {
    const problemMdContent = fs.readFileSync(problemMdPath, 'utf-8');
    return problemMdContent.trim();
  } else {
    throw new Error(`Problem.md file not found in ${problemFolder}`);
  }
}

function extractData(problemFolder) {
  const description = extractDescriptionFromFile(problemFolder);

  const structureMdPath = path.join(problemFolder, 'Structure.md');
  let title = '';

  if (fs.existsSync(structureMdPath)) {
    const structureMdContent = fs.readFileSync(structureMdPath, 'utf-8');
    
    const titleMatch = structureMdContent.match(/Problem Name:\s*"(.+?)"/);
    title = titleMatch ? titleMatch[1] : 'Unknown Title';
  } else {
    throw new Error(`Structure.md file not found in ${problemFolder}`);
  }

  const jsonData = {
    title: title,
    description: description,
  };

  return jsonData;
}

async function getProblemDetailsFromFolder(folderName) {
  const problemsFolder = path.resolve(__dirname, '..', '..', 'problems', folderName);

  try {
    const jsonData = extractData(problemsFolder);
    return jsonData;

  } catch (error) {
    console.error(`Error fetching problem details for ${folderName}:`, error.message);
    return null;
  }
}

async function getAllProblemDetails() {
  const problemsFolder = path.resolve(__dirname, '..', '..', 'problems');

  const problemFolders = fs.readdirSync(problemsFolder).filter(file => {
    return fs.statSync(path.join(problemsFolder, file)).isDirectory();
  });

  for (const folderName of problemFolders) {
    console.log(`Processing folder: ${folderName}`);
    const problemDetails = await getProblemDetailsFromFolder(folderName);
    await generateTestCases(problemDetails, folderName);
    const directoryPath = path.join(__dirname,'..', '..', 'problems', folderName, 'tests', `${folderName}.js`)
    await executeJSFile(directoryPath);
    // console.log(problemFolders);
    
    if (!problemDetails) {
      // console.log('Problem Details:', problemDetails);
      console.error("extracting details from .md files failed")
    }
  }
}

(async () => {
  await getAllProblemDetails();
  const problemsDirectoryPath = path.join(__dirname, '..', '..', 'problems');
  await processProblemsDirectory(problemsDirectoryPath);
})();


