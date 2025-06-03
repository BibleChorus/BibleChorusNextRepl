const fs = require('fs');
const path = require('path');
const INPUT_FILE = path.join(__dirname, '..', 'content', 'habitual-sin', '2025-05-11 The Eternal Danger of Habitual Sin.md');
const OUTPUT_DIR = path.join(__dirname, '..', 'content', 'habitual-sin');

function alphaIndex(num) {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  do {
    result = letters[num % 26] + result;
    num = Math.floor(num / 26) - 1;
  } while (num >= 0);
  return result;
}

function pad(num) {
  return String(num).padStart(2, '0');
}

function createFrontmatter(section) {
  const fm = {
    title: section.title,
    order: section.order,
    slug: section.slug,
    chapterNumber: section.chapterNumber || null,
    keyVerses: section.keyVerses,
    audioUrl: null,
    estimatedReadingTime: Math.ceil(section.content.split(/\s+/).length / 200)
  };
  const lines = ['---'];
  for (const [k, v] of Object.entries(fm)) {
    if (Array.isArray(v)) {
      lines.push(`${k}:`);
      v.forEach(val => lines.push(`  - "${val}"`));
    } else {
      lines.push(`${k}: ${v === null ? 'null' : `"${v}"`}`);
    }
  }
  lines.push('---', '');
  return lines.join('\n');
}

function parse() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error('Input file not found:', INPUT_FILE);
    process.exit(1);
  }
  const raw = fs.readFileSync(INPUT_FILE, 'utf8');
  const lines = raw.split(/\r?\n/);

  const sections = [];
  let current = null;
  let order = 0;
  let chapterIndex = -1;
  let subIndex = 0;

  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.*\S.*)$/);
    if (match) {
      let level = match[1].length;
      let title = match[2].replace(/<[^>]+>/g, '').trim();
      if (title.toLowerCase() === 'table of contents') continue;
      if (title === '') continue;

      if (current) {
        current.content = current.content.join('\n').trim();
        current.keyVerses = extractBibleVerses(current.content);
        sections.push(current);
      }

      let chapterNumber = null;
      const chapterMatch = title.match(/^Chapter\s+(\d+\w?)[:\s-]*(.*)$/i);
      if (chapterMatch) {
        chapterNumber = chapterMatch[1];
        title = chapterMatch[2] || `Chapter ${chapterNumber}`;
      }

      if (level === 1) {
        chapterIndex += 1;
        subIndex = 0;
      } else {
        subIndex += 1;
      }
      const prefix = level === 1 ? pad(chapterIndex) : pad(chapterIndex) + alphaIndex(subIndex - 1);
      const slug = generateSlug(title);
      current = {
        numbering: prefix,
        title,
        slug,
        order: order++,
        chapterNumber,
        level,
        content: []
      };
      continue;
    }

    if (current) {
      current.content.push(line);
    }
  }

  if (current) {
    current.content = current.content.join('\n').trim();
    current.keyVerses = extractBibleVerses(current.content);
    sections.push(current);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const index = { title: 'The Eternal Danger of Habitual Sin', chapters: [] };

  sections.forEach(sec => {
    const frontmatter = createFrontmatter(sec);
    const filepath = path.join(OUTPUT_DIR, `${sec.numbering}-${sec.slug}.mdx`);
    fs.writeFileSync(filepath, frontmatter + sec.content);
    index.chapters.push({
      title: sec.title,
      slug: sec.slug,
      order: sec.order,
      chapterNumber: sec.chapterNumber,
      keyVerses: sec.keyVerses,
      estimatedReadingTime: Math.ceil(sec.content.split(/\s+/).length / 200)
    });
    console.log('Created', filepath);
  });

  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.json'), JSON.stringify(index, null, 2));
  console.log('Index updated with', index.chapters.length, 'entries');
}

if (require.main === module) {
  parse();
}

module.exports = { parse };
