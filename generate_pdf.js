const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = path.resolve(__dirname, 'report_template.html');
const pdfPath = path.resolve(__dirname, 'SH_Bakhoor_Project_Report.pdf');

const htmlUrl = 'file:///' + htmlPath.replace(/\\/g, '/');

console.log('Generating PDF from:', htmlUrl);
console.log('Output PDF to:', pdfPath);

const result = spawnSync(chromePath, [
  '--headless',
  '--disable-gpu',
  '--no-sandbox',
  '--run-all-compositor-stages-before-draw',
  '--no-pdf-header-footer',
  `--print-to-pdf=${pdfPath}`,
  htmlUrl
], { stdio: 'inherit' });

if (fs.existsSync(pdfPath)) {
  const stats = fs.statSync(pdfPath);
  console.log(`✅ Success! PDF created at: ${pdfPath} (${stats.size} bytes)`);
} else {
  console.error('❌ PDF was not generated. Exit code:', result.status);
}
