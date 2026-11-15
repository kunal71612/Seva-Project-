const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '../frontend/dist');
const dest = path.resolve(__dirname, '../dist');

if (fs.existsSync(src)) {
  fs.cpSync(src, dest, { recursive: true });
  console.log('Successfully copied frontend/dist to root dist/');
} else {
  console.warn('Warning: frontend/dist does not exist');
}
