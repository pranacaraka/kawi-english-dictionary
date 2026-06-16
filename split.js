const fs = require('fs');
const path = require('path');

const inputPath = '/Users/yacobwijaya/Documents/kawi_english_dictionary/kawi_english_dictionary.json';
const outputDir = '/Users/yacobwijaya/Documents/kawi_english_dictionary';
const indexTemplatePath = '/Users/yacobwijaya/Documents/projects/kawi-lexico/public/data/index.json';

async function main() {
  console.log('Reading input file from: ' + inputPath);
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found at ${inputPath}`);
  }
  
  const rawData = fs.readFileSync(inputPath, 'utf8');
  console.log('Parsing JSON...');
  const entries = JSON.parse(rawData);
  console.log(`Successfully parsed ${entries.length} entries.`);

  console.log('Reading index template from: ' + indexTemplatePath);
  if (!fs.existsSync(indexTemplatePath)) {
    throw new Error(`Index template file not found at ${indexTemplatePath}`);
  }
  
  const rawIndexTemplate = fs.readFileSync(indexTemplatePath, 'utf8');
  const indexTemplate = JSON.parse(rawIndexTemplate);
  const groupsConfig = indexTemplate.groups; // [{id, query, label, file, count}, ...]

  // Initialize group arrays
  const groupsData = {};
  groupsConfig.forEach(g => {
    groupsData[g.id] = [];
  });

  const words = [];

  console.log('Processing entries...');
  entries.forEach(entry => {
    const groupId = entry.group_id;
    if (groupId === undefined || groupId === null || groupsData[groupId] === undefined) {
      console.warn(`Warning: Entry ${entry.id} (${entry.headword}) has unknown/invalid group_id: ${groupId}`);
      return;
    }
    groupsData[groupId].push(entry);

    // Extract sub_entries heads
    const subHeads = (entry.sub_entries || []).map(se => se.sub_head).filter(Boolean);

    words.push({
      w: entry.headword,
      s: subHeads,
      g: Number(groupId),
      id: String(entry.id)
    });
  });

  // Write group files and update group counts
  console.log('Writing group files...');
  groupsConfig.forEach(g => {
    const groupEntries = groupsData[g.id];
    g.count = groupEntries.length;
    const groupFile = path.join(outputDir, `group_${g.id}.json`);
    // Format group files with indentation for readability, similar to kawi-lexico group files
    fs.writeFileSync(groupFile, JSON.stringify(groupEntries, null, 2), 'utf8');
    console.log(`Wrote ${groupEntries.length} entries to group_${g.id}.json`);
  });

  // Write index.json (minified as in the original)
  const indexData = {
    groups: groupsConfig,
    words: words
  };
  const indexFile = path.join(outputDir, 'index.json');
  fs.writeFileSync(indexFile, JSON.stringify(indexData), 'utf8');
  console.log('Wrote index.json successfully.');
  console.log('Process complete!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
