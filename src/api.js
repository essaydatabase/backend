const {
  readFile,
  writeFile,
  readdir
} = require('fs');
const {
  join
} = require('path');
const {
  ESSAYS_PATH,
  DETAILS_PATH,
  INDEX_PATH
} = require('../config.js');
let DETAILS, INDEX;
try {
  DETAILS = require(DETAILS_PATH);
  INDEX = require(INDEX_PATH);
} catch (e) {
  console.error(`error loading file: ${e}`);
}
const authorize = require('./authorization');
const getEssaysDetails = require('./sheets');
const getEssaysContent = require('./drive');

function initialize() {
  authorize([createIndex]);
}

function createIndex() {
  let entry;
  const index = DETAILS;
  readdir(ESSAYS_PATH, async (err, files) => {
    if (err) return reject(err);
    files = files.filter(file => file.endsWith('.txt'));
    for (const file of files) {
      entry = index.find(detail => file.includes(detail.id));
      if (entry) {
        try {
          essay = await readEssay(join(ESSAYS_PATH, file));
          entry.paragraphs = essay.split(/\n/);
        } catch (error) {
          console.error(error);
        }
      } else {
        console.error(`entry not found: ${file}`);
      }
    }
    writeFile(INDEX_PATH, JSON.stringify(index), err => {
      if (err) return console.error(err);
      console.log(`Wrote ${INDEX_PATH}`);
    });
  });
}

function readEssay(filename) {
  return new Promise((resolve, reject) => {
    readFile(filename, 'utf8', (err, data) => {
      if (err) reject(new Error(`unable to read ${filename}`));
      else resolve(data);
    });
  });
}

function getEssay(id) {
  return new Promise((resolve, reject) => {
    if (!INDEX) {
      reject(`essays not found`);
    } else {
      const essay = INDEX.find(essay => essay.id === id);
      if (!essay) reject(`essay not found ${id}`);
      else resolve(essay);
    }
  });
}

function getEssays() {
  return new Promise((resolve, reject) => {
    if (!INDEX) {
      reject(`essays not found`);
    } else {
      resolve(INDEX);
    }
  });
}

function createError(status, message, next) {
  const error = new Error(message);
  error.status = status;
  if (next) return next(error);
  else return error;
}

module.exports = {
  getEssay,
  getEssays,
  createError,
  initialize
};