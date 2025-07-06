const fs = require('fs-extra');
const path = require('path');

const sourceBase = path.join(__dirname, '..');
const destBase = path.join(sourceBase, 'src/contracts');

// List of artifacts we want to copy
const artifacts = [
  'artifacts/contracts/services/AddService.sol/AddService.json',
  'artifacts/contracts/services/IAddService.sol/IAddService.json',
  'artifacts/contracts/services/TopAcc.sol/TopAcc.json',
  'artifacts/contracts/services/ITopAcc.sol/ITopAcc.json'
];

// Ensure destination directory exists
fs.ensureDirSync(destBase);

// Copy each artifact
artifacts.forEach(artifactPath => {
  const source = path.join(sourceBase, artifactPath);
  const dest = path.join(destBase, artifactPath.replace('artifacts/contracts/', ''));
  
  // Ensure the destination directory exists
  fs.ensureDirSync(path.dirname(dest));
  
  try {
    fs.copyFileSync(source, dest);
    console.log(`Copied: ${artifactPath}`);
  } catch (error) {
    console.error(`Error copying ${artifactPath}:`, error.message);
  }
});

console.log('\nAll contract artifacts have been copied to src/contracts');
