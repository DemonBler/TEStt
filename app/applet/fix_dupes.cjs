const fs = require('fs');
let content = fs.readFileSync('src/lib/NeuralKinematics.ts', 'utf8');

let keys = new Set();
let lines = content.split('\n');
let newLines = [];
let insideDict = false;

for (let i = 0; i < lines.length; i++) {
   if (lines[i].includes('export const EXPRESSION_DICTIONARY')) {
       insideDict = true;
       newLines.push(lines[i]);
       continue;
   }
   if (insideDict && lines[i].startsWith('};')) {
       insideDict = false;
       newLines.push(lines[i]);
       continue;
   }
   if (insideDict) {
       let match = lines[i].match(/^\s*'([^']+)'\s*:/);
       if (match) {
           let key = match[1];
           if (keys.has(key)) {
               console.log("Removing duplicate: " + key + " on line " + (i+1));
               continue; // skip
           }
           keys.add(key);
       }
   }
   newLines.push(lines[i]);
}

fs.writeFileSync('src/lib/NeuralKinematics.ts', newLines.join('\n'));
console.log("Deduplication complete.");
