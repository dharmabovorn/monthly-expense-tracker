const fs = require('fs');
const path = require('path');

console.log('🚀 Starting build process...');

// Create necessary directories
const publicDir = path.join(__dirname, 'public');
console.log('📂 Ensuring public directory exists...');
try {
    if (!fs.existsSync(publicDir)) {
        console.log('  → Creating public directory...');
        fs.mkdirSync(publicDir, { recursive: true });
    }

    // Copy index.html to public directory
    console.log('📄 Copying index.html...');
    const indexSource = path.join(__dirname, 'index.html');
    const indexDest = path.join(publicDir, 'index.html');
    
    if (fs.existsSync(indexSource)) {
        fs.copyFileSync(indexSource, indexDest);
        console.log('  → Successfully copied index.html');
    } else {
        throw new Error('❌ index.html not found in the project root');
    }

    // Create _redirects file
    console.log('🔄 Creating _redirects file...');
    const redirectsPath = path.join(publicDir, '_redirects');
    fs.writeFileSync(redirectsPath, '/* /index.html 200');
    console.log('  → Created _redirects');

    // Create _headers file
    console.log('🔒 Creating _headers file...');
    const headersPath = path.join(publicDir, '_headers');
    const headersContent = `/*
  X-Frame-Options: ALLOW-FROM https://expense-tracker-2048.streamlit.app
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin`;
    
    fs.writeFileSync(headersPath, headersContent);
    console.log('  → Created _headers');

    console.log('\n✅ Build completed successfully!');
    process.exit(0);
    
} catch (error) {
    console.error('\n❌ Build failed:');
    console.error(error.message);
    process.exit(1);
}
