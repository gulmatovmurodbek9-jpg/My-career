const fs = require('fs');
const filepath = 'c:/Users/admin/Desktop/Projects/A Back My career/nest-backend/src/career/career.service.ts';
let content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');
const croppedLines = lines.slice(0, 707); // Up to the intended end of the block
fs.writeFileSync(filepath, croppedLines.join('\n'), 'utf8');
console.log('Cropped file!');
