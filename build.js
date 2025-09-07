const fs = require('fs-extra');
const path = require('path');

// Create build directory if it doesn't exist
const buildDir = path.join(__dirname, 'build');

// Ensure build directory exists
fs.ensureDirSync(buildDir);

// Copy all necessary files
const filesToCopy = ['index.html', 'app.js', 'netlify.toml', 'package.json', 'package-lock.json'];

filesToCopy.forEach(file => {
    if (fs.existsSync(file)) {
        fs.copyFileSync(file, path.join(buildDir, file));
        console.log(`Copied ${file} to build directory`);
    }
});

// Copy public directory if it exists
if (fs.existsSync('public')) {
    fs.copySync('public', path.join(buildDir, 'public'));
    console.log('Copied public directory to build directory');
}

console.log('Build completed successfully!');
