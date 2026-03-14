const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Create a simple PWA logo
const canvas = createCanvas(512, 512);
const ctx = canvas.getContext('2d');

// Blue background gradient
const gradient = ctx.createLinearGradient(0, 0, 512, 512);
gradient.addColorStop(0, '#3B82F6');
gradient.addColorStop(1, '#1F40AF');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 512, 512);

// Add some design
// Draw a circle with "S"
ctx.fillStyle = '#FFFFFF';
ctx.beginPath();
ctx.arc(256, 256, 200, 0, Math.PI * 2);
ctx.fill();

// Add text "SIDRA TV"
ctx.fillStyle = '#3B82F6';
ctx.font = 'bold 80px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('SIDRA', 256, 256);

// Save the image
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(path.join(__dirname, 'public', 'logo.png'), buffer);
console.log('✅ Logo PNG generated successfully!');
