const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

// Configuration for the book conversion
const BOOK_CONFIG = {
  title: "The Eternal Danger of Habitual Sin",
  inputFile: "Reference/The-Eternal-Danger-of-Habitual-Sin.docx", // Adjust path as needed
  outputDir: "content/habitual-sin",
  chapterPatterns: [
    /^Chapter\s+(\d+)[\:\-\s]*(.*?)$/i,
    /^(\d+)[\.\)\-\s]+(.*?)$/i,
    /^Preface/i,
    /^Introduction/i,
    /^Reflection Questions?/i
  ]
};

/**
 * Extracts Bible verses from text content
 * @param {string} text - The text to search for verses
 * @returns {Array} - Array of verse references found
 */
function extractBibleVerses(text) {
  // Regex patterns for Bible verse references
  const versePatterns = [
    // Standard format: Book Chapter:Verse
    /\b(\d?\s?[A-Za-z]+)\s+(\d+):(\d+(?:-\d+)?)\b/g,
    // Alternative format: Book Chapter.Verse
    /\b(\d?\s?[A-Za-z]+)\s+(\d+)\.(\d+(?:-\d+)?)\b/g,
    // Full word books: Romans, Corinthians, etc.
    /\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Samuel|Kings|Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs?|Ecclesiastes|Song|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|James|Peter|Jude|Revelation)\s+(\d+):(\d+(?:-\d+)?)\b/gi
  ];

  const verses = new Set();
  
  versePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const book = match[1].trim();
      const chapter = match[2];
      const verse = match[3];
      verses.add(`${book} ${chapter}:${verse}`);
    }
  });

  return Array.from(verses);
}

/**
 * Generates a slug from a title
 * @param {string} title - The title to convert to slug
 * @returns {string} - URL-friendly slug
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim('-'); // Remove leading/trailing hyphens
}

/**
 * Parses the document content into chapters
 * @param {string} htmlContent - The HTML content from mammoth
 * @returns {Array} - Array of chapter objects
 */
function parseChapters(htmlContent) {
  const chapters = [];
  const lines = htmlContent.split('\n').filter(line => line.trim());
  
  let currentChapter = null;
  let content = [];
  let order = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if this line is a chapter heading
    let isChapterStart = false;
    let chapterTitle = '';
    let chapterNumber = null;

    for (const pattern of BOOK_CONFIG.chapterPatterns) {
      const match = line.match(pattern);
      if (match) {
        isChapterStart = true;
        if (pattern.source.includes('Chapter')) {
          chapterNumber = parseInt(match[1]);
          chapterTitle = match[2] || `Chapter ${chapterNumber}`;
        } else if (pattern.source.includes('Preface')) {
          chapterTitle = 'Preface';
        } else if (pattern.source.includes('Introduction')) {
          chapterTitle = 'Introduction';
        } else if (pattern.source.includes('Reflection')) {
          chapterTitle = 'Reflection Questions';
        } else {
          chapterNumber = parseInt(match[1]);
          chapterTitle = match[2] || `Chapter ${chapterNumber}`;
        }
        break;
      }
    }

    if (isChapterStart) {
      // Save previous chapter if exists
      if (currentChapter) {
        currentChapter.content = content.join('\n').trim();
        currentChapter.keyVerses = extractBibleVerses(currentChapter.content);
        chapters.push(currentChapter);
      }

      // Start new chapter
      currentChapter = {
        title: chapterTitle.trim(),
        chapterNumber,
        slug: generateSlug(chapterTitle),
        order: order++,
        content: '',
        keyVerses: []
      };
      content = [];
    } else if (currentChapter) {
      // Add content to current chapter
      content.push(line);
    }
  }

  // Add the last chapter
  if (currentChapter) {
    currentChapter.content = content.join('\n').trim();
    currentChapter.keyVerses = extractBibleVerses(currentChapter.content);
    chapters.push(currentChapter);
  }

  return chapters;
}

/**
 * Converts HTML content to MDX format
 * @param {string} htmlContent - HTML content to convert
 * @returns {string} - MDX formatted content
 */
function htmlToMdx(htmlContent) {
  // Convert HTML tags to MDX/Markdown
  let mdx = htmlContent
    // Convert paragraphs
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    // Convert headers
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n')
    // Convert emphasis
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    // Convert lists
    .replace(/<ul[^>]*>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ol[^>]*>/gi, '\n')
    .replace(/<\/ol>/gi, '\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1')
    // Remove other HTML tags
    .replace(/<[^>]*>/g, '')
    // Clean up whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/^\s+|\s+$/g, '');

  return mdx;
}

/**
 * Creates MDX frontmatter
 * @param {Object} chapter - Chapter object
 * @returns {string} - Frontmatter string
 */
function createFrontmatter(chapter) {
  const frontmatter = {
    title: chapter.title,
    order: chapter.order,
    slug: chapter.slug,
    keyVerses: chapter.keyVerses,
    chapterNumber: chapter.chapterNumber || null,
    audioUrl: null, // To be populated later with actual audio URLs
    estimatedReadingTime: Math.ceil(chapter.content.split(' ').length / 200) // ~200 words per minute
  };

  return `---\n${Object.entries(frontmatter)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}:\n${value.map(v => `  - "${v}"`).join('\n')}`;
      }
      return `${key}: ${value === null ? 'null' : `"${value}"`}`;
    })
    .join('\n')}\n---\n\n`;
}

/**
 * Main conversion function
 */
async function convertWordToMdx() {
  try {
    console.log('Starting conversion of habitual sin book...');
    
    // Check if input file exists
    if (!fs.existsSync(BOOK_CONFIG.inputFile)) {
      console.error(`Input file not found: ${BOOK_CONFIG.inputFile}`);
      console.log('Please place the Word document in the Reference/ directory');
      process.exit(1);
    }

    // Ensure output directory exists
    if (!fs.existsSync(BOOK_CONFIG.outputDir)) {
      fs.mkdirSync(BOOK_CONFIG.outputDir, { recursive: true });
    }

    // Convert Word document to HTML
    console.log('Converting Word document to HTML...');
    const result = await mammoth.convertToHtml({ path: BOOK_CONFIG.inputFile });
    const htmlContent = result.value;
    
    if (result.messages.length > 0) {
      console.log('Conversion messages:', result.messages);
    }

    // Parse chapters from HTML content
    console.log('Parsing chapters...');
    const chapters = parseChapters(htmlContent);
    
    console.log(`Found ${chapters.length} chapters/sections`);

    // Convert each chapter to MDX
    for (const chapter of chapters) {
      console.log(`Processing: ${chapter.title}`);
      
      const mdxContent = htmlToMdx(chapter.content);
      const frontmatter = createFrontmatter(chapter);
      const fullMdx = frontmatter + mdxContent;
      
      const filename = `${String(chapter.order).padStart(2, '0')}-${chapter.slug}.mdx`;
      const filepath = path.join(BOOK_CONFIG.outputDir, filename);
      
      fs.writeFileSync(filepath, fullMdx);
      console.log(`Created: ${filename}`);
    }

    // Create index file with metadata
    const indexContent = {
      title: BOOK_CONFIG.title,
      chapters: chapters.map(ch => ({
        title: ch.title,
        slug: ch.slug,
        order: ch.order,
        chapterNumber: ch.chapterNumber,
        keyVerses: ch.keyVerses,
        estimatedReadingTime: Math.ceil(ch.content.split(' ').length / 200)
      }))
    };

    fs.writeFileSync(
      path.join(BOOK_CONFIG.outputDir, 'index.json'),
      JSON.stringify(indexContent, null, 2)
    );

    console.log('✅ Conversion completed successfully!');
    console.log(`📁 Output directory: ${BOOK_CONFIG.outputDir}`);
    console.log(`📚 Total chapters: ${chapters.length}`);
    
  } catch (error) {
    console.error('❌ Error during conversion:', error);
    process.exit(1);
  }
}

// Run the conversion if this script is called directly
if (require.main === module) {
  convertWordToMdx();
}

module.exports = { convertWordToMdx, extractBibleVerses, generateSlug }; 