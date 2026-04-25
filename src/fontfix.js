const fs = require('fs');
const files = ['src/Layout.jsx', 'src/Dashboard.jsx', 'src/CounterpartiesList.jsx', 'src/CounterpartyDetail.jsx'];

const replacements = [
  [/fontSize: 9,/g, 'fontSize: 11,'],
  [/fontSize: 8,/g, 'fontSize: 10,'],
  [/fontSize: 10, letterSpacing/g, 'fontSize: 12, letterSpacing'],
  [/fontSize: 11, letterSpacing/g, 'fontSize: 13, letterSpacing'],
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  replacements.forEach(([from, to]) => {
    content = content.replace(from, to);
  });
  fs.writeFileSync(file, content);
  console.log('Updated: ' + file);
});
