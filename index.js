const fs = require('fs');
const inquirer = require('inquirer');
require('dotenv').config();
const { getLeetCodeProblemDetails } = require('./scrapeLeetcode');
const { generateTestCases } = require('./generateTestCases');
const path = require('path');
const { executeJSFile } = require('./execute');
const { splitJsonToInputOutput } = require('./splitJson');
const xlsx = require('xlsx');

function checkOrCreateEnv() {
  const envPath = path.join(__dirname, '.env');

  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, '');
  }

  require('dotenv').config();

  if (!process.env.ANTHROPIC_API_KEY) {
    return false;
  }

  return true;
}

function storeAPIKeyInEnv(apiKey) {
  const envPath = path.join(__dirname, '.env');
  const envContent = `ANTHROPIC_API_KEY=${apiKey}\n`;
  fs.appendFileSync(envPath, envContent);
  console.log('API key has been saved in .env file.');
}


async function processLink(link) {
  try {
    const problemData = await getLeetCodeProblemDetails(link);

    if (problemData) {
      const slug = problemData.title.toLowerCase().replace(/\s+/g, '-');
      await generateTestCases(problemData, slug);

      const filePath = path.join(__dirname, 'problems', `${slug}`, `${slug}.js`);
      const jsonFilePath = await executeJSFile(filePath);

      if (fs.existsSync(jsonFilePath)) {
        splitJsonToInputOutput(jsonFilePath);
      } else {
        console.log('JSON file not found after executing the JavaScript file.');
      }
    } else {
      console.log(`Failed to fetch data for link: ${link}`);
    }
  } catch (error) {
    console.error(`Error processing link: ${link}`, error);
  }
}

async function processLinks(links) {
  for (const link of links) {
    await processLink(link);
  }
}

async function main() {
  const apiKeyExists = checkOrCreateEnv();

  if (!apiKeyExists) {
    const { apiKey } = await inquirer.prompt([
      {
        type: 'input',
        name: 'apiKey',
        message: 'Enter your ANTHROPIC_API_KEY:',
        validate: (input) => input.trim() !== '' || 'API key cannot be empty!',
      },
    ]);

    storeAPIKeyInEnv(apiKey);
    require('dotenv').config();
  }

  const filePath = path.join(__dirname, 'as.xlsx');
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = xlsx.utils.sheet_to_json(sheet);
  const links = jsonData.map(row => row["LeetCode Link"]).filter(Boolean);

  if (!links || links.length === 0) {
    console.error('No valid LeetCode links found in the Excel sheet.');
    return;
  }
  console.log('Starting to process LeetCode links...');
  
  await processLinks(links);
  console.log('All LeetCode problems processed successfully.');
  checkSlugFolders(links);
}



function checkSlugFolders(links) {
  for (const link of links) {


    function extractSlugFromUrl(url) {
      if (!url || typeof url !== 'string') {
        console.error('Invalid URL provided to extractSlugFromUrl:', url);
        return null;
      }
      const match = url.match(/\/problems\/([^/]+)/);
      return match ? match[1] : null;
    }

    const slug = extractSlugFromUrl(link);

    // const slug = link.split('/').pop(); // Assuming the last part of the URL is the slug
    const problemFolder = path.join(__dirname, 'problems', slug);

    if (fs.existsSync(problemFolder)) {
      const files = fs.readdirSync(problemFolder);
      const jsFileExists = files.includes(`${slug}.js`);
      const jsonFileExists = files.includes(`${slug}.json`);

      console.log(`Checking folder for ${slug}:`);
      console.log(`JavaScript file exists: ${jsFileExists}`);
      console.log(`JSON file exists: ${jsonFileExists}`);
    } else {
      console.log(`No folder found for ${slug}`);
    }
  }
}



main();
