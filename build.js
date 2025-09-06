const fs = require('fs');
const path = require('path');

// Create necessary directories
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
    console.log('Creating public directory...');
    fs.mkdirSync(publicDir, { recursive: true });
}

// Copy the correct index.html to public directory
const indexSource = path.join(__dirname, '..', 'index.html');
const indexDest = path.join(publicDir, 'index.html');

if (fs.existsSync(indexSource)) {
    console.log('Copying index.html to public directory...');
    fs.copyFileSync(indexSource, indexDest);
} else {
    console.error('Error: Could not find index.html in the project root');
    process.exit(1);
}

// Create _redirects file for SPA routing
const redirectsPath = path.join(publicDir, '_redirects');
if (!fs.existsSync(redirectsPath)) {
    console.log('Creating _redirects file...');
    fs.writeFileSync(redirectsPath, '/* /index.html 200');
}

// Create _headers file for security headers
const headersPath = path.join(publicDir, '_headers');
if (!fs.existsSync(headersPath)) {
    console.log('Creating _headers file...');
    const headersContent = `/*
  X-Frame-Options: ALLOW-FROM https://expense-tracker-2048.streamlit.app
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin`;
    
    fs.writeFileSync(headersPath, headersContent);
}

console.log('✅ Build completed successfully!');
process.exit(0);
