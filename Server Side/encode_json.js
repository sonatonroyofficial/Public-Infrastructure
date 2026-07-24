const fs = require('fs');
const json = fs.readFileSync('public-infrastrure-system-firebase-adminsdk.json', 'utf8');
console.log(JSON.stringify(JSON.parse(json)));
