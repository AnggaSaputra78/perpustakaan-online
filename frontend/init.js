const fs = require('fs');
const folders = [
  'src/components/ui', 'src/components/forms', 'src/components/cards',
  'src/components/layout', 'src/components/navbar', 'src/services',
  'src/hooks', 'src/store', 'src/utils', 'src/lib', 'src/types', 'src/middleware'
];

folders.forEach(dir => {
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created: ${dir}`);
  }
});