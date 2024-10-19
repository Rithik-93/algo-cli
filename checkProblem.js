const fs = require('fs');
const inquirer = require('inquirer');
require('dotenv').config();
const { getLeetCodeProblemDetails } = require('./scrapeLeetcode');
const { generateTestCases } = require('./generateTestCases');
const path = require('path');
const { executeJSFile } = require('./execute');
const { splitJsonToInputOutput } = require('./splitJson');
const xlsx = require('xlsx');

const filePath = path.join(__dirname, 'as.xlsx');
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const jsonData = xlsx.utils.sheet_to_json(sheet);
const links = jsonData.map(row => row["LeetCode Link"]).filter(Boolean);

const missingFilePath = path.join(__dirname, 'missingFile.txt');

fs.writeFileSync(missingFilePath, '');


if (!links || links.length === 0) {
    console.error('No valid LeetCode links found in the Excel sheet.');
    return;
}


checkSlugFolders(links);


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
        if (!slug) {
            continue;
        }

        // const slug = link.split('/').pop(); // Assuming the last part of the URL is the slug
        const problemFolder = path.join(__dirname, 'problems', slug);


        if (fs.existsSync(problemFolder)) {
            const files = fs.readdirSync(problemFolder);
            const jsFileExists = files.includes(`${slug}.js`);
            const jsonFileExists = files.includes(`${slug}.json`);

            if (!jsFileExists || !jsonFileExists) {
                // Append missing JS or JSON file info to missingFile.txt
                fs.appendFileSync(missingFilePath, `${slug}: Missing ${!jsFileExists ? 'JS file' : ''} ${!jsonFileExists ? 'JSON file' : ''}\n`);
            }
        } else {
            // Folder doesn't exist, write that to missingFile.txt
            fs.appendFileSync(missingFilePath, `${slug}: Folder not found\n`);
        }
    }
};