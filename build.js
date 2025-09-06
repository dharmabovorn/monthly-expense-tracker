const fs = require('fs');
const path = require('path');

// Ensure public directory exists
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    console.log('Creating public directory...');
    fs.mkdirSync(publicDir);
}

console.log('Build completed successfully!');
process.exit(0);
