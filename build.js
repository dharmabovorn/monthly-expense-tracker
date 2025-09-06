const fs = require('fs');
const path = require('path');

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    console.log('Creating public directory...');
    fs.mkdirSync(publicDir, { recursive: true });
}

// Create a basic index.html if it doesn't exist
const indexPath = path.join(publicDir, 'index.html');
if (!fs.existsSync(indexPath)) {
    console.log('Creating default index.html...');
    const defaultHtml = `<!DOCTYPE html>
<html>
<head>
    <title>Expense Tracker</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>Expense Tracker</h1>
    <p>Loading the application...</p>
    <p>If you're seeing this message, please check if the Streamlit app URL is correctly configured.</p>
</body>
</html>`;
    fs.writeFileSync(indexPath, defaultHtml);
}

// Create a _redirects file for SPA routing
const redirectsPath = path.join(publicDir, '_redirects');
if (!fs.existsSync(redirectsPath)) {
    console.log('Creating _redirects file...');
    fs.writeFileSync(redirectsPath, '/* /index.html 200');
}

console.log('✅ Build completed successfully!');
process.exit(0);
