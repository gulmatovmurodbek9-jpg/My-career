const fs = require('fs');
const file = 'c:/Users/admin/Desktop/Projects/My Career/Back/nest-backend/src/quiz/data/questions.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/"part": "specialty"/g, 'part: QuizPart.SPECIALTY');
fs.writeFileSync(file, content);
