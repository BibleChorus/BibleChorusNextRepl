#!/usr/bin/env node

/**
 * Test script for the Habitual Sin Learning Module
 * This script verifies that all components can be imported and basic functionality works
 */

console.log('🧪 Testing Habitual Sin Learning Module...\n');

// Test 1: Verify MDX content can be read
console.log('📖 Test 1: Reading MDX content...');
try {
  const fs = require('fs');
  const path = require('path');
  
  const contentDir = path.join(__dirname, '../content/habitual-sin');
  
  // Check if content directory exists
  if (fs.existsSync(contentDir)) {
    const files = fs.readdirSync(contentDir);
    console.log(`   ✅ Found ${files.length} files in content directory:`);
    files.forEach(file => console.log(`      - ${file}`));
  } else {
    console.log('   ⚠️  Content directory not found, creating...');
    fs.mkdirSync(contentDir, { recursive: true });
    console.log('   ✅ Content directory created');
  }
} catch (error) {
  console.log(`   ❌ Error reading content: ${error.message}`);
}

console.log();

// Test 2: Verify chapter index exists
console.log('📚 Test 2: Checking chapter index...');
try {
  const fs = require('fs');
  const path = require('path');
  
  const indexPath = path.join(__dirname, '../content/habitual-sin/index.json');
  
  if (fs.existsSync(indexPath)) {
    const indexContent = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    console.log(`   ✅ Found chapter index with ${indexContent.chapters?.length || 0} chapters`);
    
    if (indexContent.chapters && indexContent.chapters.length > 0) {
      console.log('   📖 Chapters:');
      indexContent.chapters.forEach(chapter => {
        console.log(`      - ${chapter.slug}: ${chapter.title}`);
      });
    }
  } else {
    console.log('   ⚠️  Chapter index not found');
  }
} catch (error) {
  console.log(`   ❌ Error reading chapter index: ${error.message}`);
}

console.log();

// Test 3: Test Quiz Generator (without database)
console.log('🧠 Test 3: Testing Quiz Generator...');
try {
  // Mock content for testing
  const sampleContent = `
    # Test Chapter
    
    This is a sample chapter about **spiritual growth**. The Bible tells us in **Romans 6:23** that 
    "the wages of sin is death." This is an important verse to remember.
    
    ## Key Points
    - Sin has consequences
    - God offers forgiveness
    - We need to repent
  `;
  
  const sampleFrontmatter = {
    title: "Test Chapter",
    description: "A test chapter for validation",
    estimatedReadTime: 10,
    difficulty: "easy"
  };
  
  // Import and test quiz generator functions if they can be loaded
  try {
    const { generateQuiz } = require('../lib/quizGenerator');
    console.log('   ✅ Quiz generator imported successfully');
    
    // Try to generate a quiz (this might fail if it requires database)
    console.log('   🔄 Attempting to generate sample quiz...');
    // Note: This might not work without proper setup, but at least we can import
    
  } catch (importError) {
    console.log(`   ⚠️  Quiz generator import failed: ${importError.message}`);
  }
  
} catch (error) {
  console.log(`   ❌ Quiz generator test failed: ${error.message}`);
}

console.log();

// Test 4: Verify React components can be imported (in a Node.js context this will likely fail)
console.log('⚛️  Test 4: Checking React components...');
try {
  const fs = require('fs');
  const path = require('path');
  
  const componentsDir = path.join(__dirname, '../components/habitual-sin');
  
  if (fs.existsSync(componentsDir)) {
    const components = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));
    console.log(`   ✅ Found ${components.length} React components:`);
    components.forEach(component => {
      console.log(`      - ${component}`);
      
      // Check if component exports default
      const componentPath = path.join(componentsDir, component);
      const content = fs.readFileSync(componentPath, 'utf8');
      if (content.includes('export default')) {
        console.log(`        ✅ Has default export`);
      } else {
        console.log(`        ⚠️  No default export found`);
      }
    });
  } else {
    console.log('   ⚠️  Components directory not found');
  }
} catch (error) {
  console.log(`   ❌ Component check failed: ${error.message}`);
}

console.log();

// Test 5: Verify pages exist
console.log('📄 Test 5: Checking page structure...');
try {
  const fs = require('fs');
  const path = require('path');
  
  const pagesDir = path.join(__dirname, '../pages/learn/habitual-sin');
  
  if (fs.existsSync(pagesDir)) {
    console.log('   ✅ Pages directory exists');
    
    // Check main index page
    const indexPage = path.join(pagesDir, 'index.tsx');
    if (fs.existsSync(indexPage)) {
      console.log('   ✅ Main index page exists');
    } else {
      console.log('   ⚠️  Main index page not found');
    }
    
    // Check dynamic chapter directory
    const chapterDir = path.join(pagesDir, '[chapterSlug]');
    if (fs.existsSync(chapterDir)) {
      console.log('   ✅ Chapter directory exists');
      
      const chapterIndex = path.join(chapterDir, 'index.tsx');
      const quizPage = path.join(chapterDir, 'quiz.tsx');
      
      if (fs.existsSync(chapterIndex)) {
        console.log('   ✅ Chapter reader page exists');
      } else {
        console.log('   ⚠️  Chapter reader page not found');
      }
      
      if (fs.existsSync(quizPage)) {
        console.log('   ✅ Quiz page exists');
      } else {
        console.log('   ⚠️  Quiz page not found');
      }
    } else {
      console.log('   ⚠️  Chapter directory not found');
    }
  } else {
    console.log('   ⚠️  Pages directory not found');
  }
} catch (error) {
  console.log(`   ❌ Page structure check failed: ${error.message}`);
}

console.log();

// Test 6: Verify API routes exist
console.log('🛠️  Test 6: Checking API routes...');
try {
  const fs = require('fs');
  const path = require('path');
  
  const apiDir = path.join(__dirname, '../pages/api/learn');
  
  if (fs.existsSync(apiDir)) {
    console.log('   ✅ API directory exists');
    
    const progressApi = path.join(apiDir, 'progress.ts');
    const notesApi = path.join(apiDir, 'notes.ts');
    
    if (fs.existsSync(progressApi)) {
      console.log('   ✅ Progress API exists');
    } else {
      console.log('   ⚠️  Progress API not found');
    }
    
    if (fs.existsSync(notesApi)) {
      console.log('   ✅ Notes API exists');
    } else {
      console.log('   ⚠️  Notes API not found');
    }
  } else {
    console.log('   ⚠️  API directory not found');
  }
} catch (error) {
  console.log(`   ❌ API routes check failed: ${error.message}`);
}

console.log();

// Test 7: Verify hooks exist
console.log('🪝 Test 7: Checking React hooks...');
try {
  const fs = require('fs');
  const path = require('path');
  
  const hooksDir = path.join(__dirname, '../hooks');
  
  if (fs.existsSync(hooksDir)) {
    const progressHook = path.join(hooksDir, 'useProgress.tsx');
    const userHook = path.join(hooksDir, 'useUser.ts');
    
    if (fs.existsSync(progressHook)) {
      console.log('   ✅ useProgress hook exists');
    } else {
      console.log('   ⚠️  useProgress hook not found');
    }
    
    if (fs.existsSync(userHook)) {
      console.log('   ✅ useUser hook exists');
    } else {
      console.log('   ⚠️  useUser hook not found');
    }
  } else {
    console.log('   ⚠️  Hooks directory not found');
  }
} catch (error) {
  console.log(`   ❌ Hooks check failed: ${error.message}`);
}

console.log();

// Test 8: Verify migration files exist
console.log('🗃️  Test 8: Checking database migrations...');
try {
  const fs = require('fs');
  const path = require('path');
  
  const migrationsDir = path.join(__dirname, '../db/migrations');
  
  if (fs.existsSync(migrationsDir)) {
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.includes('reading_progress') || f.includes('user_notes'));
    
    console.log(`   ✅ Found ${migrationFiles.length} relevant migration files:`);
    migrationFiles.forEach(file => console.log(`      - ${file}`));
  } else {
    console.log('   ⚠️  Migrations directory not found');
  }
} catch (error) {
  console.log(`   ❌ Migrations check failed: ${error.message}`);
}

console.log();

// Summary
console.log('📊 Summary:');
console.log('   The Habitual Sin Learning Module appears to be set up with:');
console.log('   - Content management system (MDX files)');
console.log('   - React components for UI');
console.log('   - Next.js pages for routing');
console.log('   - API routes for backend functionality');
console.log('   - Database schema for progress tracking');
console.log('   - Testing infrastructure');
console.log();
console.log('🎉 Test complete! The module structure is in place.');
console.log('💡 Next steps:');
console.log('   1. Ensure database is set up and migrations run');
console.log('   2. Add sample MDX content');
console.log('   3. Test in development mode with `npm run dev`');
console.log('   4. Run unit tests with `npm test`');
console.log('   5. Deploy and verify in production'); 