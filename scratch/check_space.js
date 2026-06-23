const fs = require('fs');
const path = require('path');

function getDirSize(dirPath) {
  let size = 0;
  try {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        size += getDirSize(filePath);
      } else {
        size += stat.size;
      }
    }
  } catch (err) {
    console.error(err);
  }
  return size;
}

const brainDir = 'C:\\Users\\THINKPAD\\.gemini\\antigravity-ide\\brain\\f4b476db-aa12-4cfa-b36b-ac4c5a6eadf0';
console.log('Brain directory size:', (getDirSize(brainDir) / (1024 * 1024)).toFixed(2), 'MB');
