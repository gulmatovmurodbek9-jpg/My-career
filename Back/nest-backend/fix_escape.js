const fs = require('fs');
const filepath = 'c:/Users/admin/Desktop/Projects/A Back My career/nest-backend/src/career/career.service.ts';
let content = fs.readFileSync(filepath, 'utf8');

content = content.replace(/\\`/g, "`");
content = content.replace(/\\\$/g, "$");

fs.writeFileSync(filepath, content, 'utf8');
console.log('Fixed escaping!');
