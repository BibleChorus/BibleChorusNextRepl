const knex = require('knex');
const config = require('../knexfile.js');

// Initialize database connection
const db = knex(config.development || config.production);

// Sample data
const sampleUsers = [
  {
    id: 1,
    username: 'learner1',
    email: 'learner1@example.com',
    name: 'John Smith',
    bio: 'Seeking spiritual growth through Biblical learning',
  },
  {
    id: 2,
    username: 'student2',
    email: 'student2@example.com', 
    name: 'Sarah Johnson',
    bio: 'Passionate about understanding Scripture deeply',
  },
  {
    id: 3,
    username: 'seeker3',
    email: 'seeker3@example.com',
    name: 'Michael Brown',
    bio: 'On a journey to overcome habitual sin',
  }
];

const sampleReadingProgress = [
  // User 1 - Advanced progress
  {
    user_id: 1,
    chapter_slug: '00-preface',
    reading_started_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    last_read_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
    reading_completed_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    progress_percentage: 100,
    time_spent_reading: 900, // 15 minutes
    reading_completed: true,
    quiz_started_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    quiz_completed_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    quiz_score: 85,
    quiz_time_spent: 300, // 5 minutes
    quiz_attempts: 1,
    quiz_completed: true,
    quiz_answers: JSON.stringify([
      { questionId: 'q1', answer: 'correct', isCorrect: true },
      { questionId: 'q2', answer: 'incorrect', isCorrect: false },
      { questionId: 'q3', answer: 'correct', isCorrect: true }
    ]),
    notes_count: 2,
    reflection_completed: true,
    last_activity_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    user_id: 1,
    chapter_slug: '01-the-progressive-nature-of-sin',
    reading_started_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    last_read_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    reading_completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    progress_percentage: 100,
    time_spent_reading: 1800, // 30 minutes
    reading_completed: true,
    quiz_started_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    quiz_completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    quiz_score: 92,
    quiz_time_spent: 420, // 7 minutes
    quiz_attempts: 1,
    quiz_completed: true,
    quiz_answers: JSON.stringify([
      { questionId: 'q1', answer: 'correct', isCorrect: true },
      { questionId: 'q2', answer: 'correct', isCorrect: true },
      { questionId: 'q3', answer: 'correct', isCorrect: true },
      { questionId: 'q4', answer: 'incorrect', isCorrect: false }
    ]),
    notes_count: 3,
    reflection_completed: true,
    last_activity_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  
  // User 2 - Moderate progress
  {
    user_id: 2,
    chapter_slug: '00-preface',
    reading_started_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    last_read_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    reading_completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    progress_percentage: 100,
    time_spent_reading: 720, // 12 minutes
    reading_completed: true,
    quiz_started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    quiz_completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    quiz_score: 75,
    quiz_time_spent: 480, // 8 minutes
    quiz_attempts: 2,
    quiz_completed: true,
    quiz_answers: JSON.stringify([
      { questionId: 'q1', answer: 'correct', isCorrect: true },
      { questionId: 'q2', answer: 'incorrect', isCorrect: false },
      { questionId: 'q3', answer: 'incorrect', isCorrect: false }
    ]),
    notes_count: 1,
    reflection_completed: true,
    last_activity_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    user_id: 2,
    chapter_slug: '01-the-progressive-nature-of-sin',
    reading_started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    last_read_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    progress_percentage: 65,
    time_spent_reading: 900, // 15 minutes
    reading_completed: false,
    quiz_attempts: 0,
    quiz_completed: false,
    notes_count: 1,
    reflection_completed: false,
    last_activity_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },

  // User 3 - Just started
  {
    user_id: 3,
    chapter_slug: '00-preface',
    reading_started_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    last_read_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    progress_percentage: 25,
    time_spent_reading: 300, // 5 minutes
    reading_completed: false,
    quiz_attempts: 0,
    quiz_completed: false,
    notes_count: 0,
    reflection_completed: false,
    last_activity_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  }
];

const sampleUserNotes = [
  {
    user_id: 1,
    chapter_slug: '00-preface',
    note_title: 'Initial Thoughts on Habitual Sin',
    note_content: `This preface really opened my eyes to the seriousness of habitual sin. The author's warning about the progressive nature of sin is particularly convicting. I realize I've been too casual about certain patterns in my life that I've justified as "small sins."

The emphasis on God's holiness and our need for genuine repentance is both humbling and hopeful. I appreciate how the author points to Christ's sacrifice as our only hope for forgiveness and transformation.`,
    note_type: 'reflection',
    tags: JSON.stringify(['conviction', 'repentance', 'holiness']),
    is_private: true,
    sentiment: 'reflective',
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  },
  {
    user_id: 1,
    chapter_slug: '00-preface',
    note_title: 'Prayer for Accountability',
    note_content: `Lord, I confess that I have been too tolerant of sin in my life. Please give me wisdom to recognize the areas where I've allowed habitual patterns to take root. Help me to take sin seriously as You do, and grant me the courage to seek accountability from fellow believers.

I pray for a heart that is sensitive to Your Spirit and quick to repent when I fall short. Thank You for Your grace that covers my failures and Your power that enables transformation.`,
    note_type: 'prayer',
    tags: JSON.stringify(['prayer', 'accountability', 'confession']),
    is_private: true,
    sentiment: 'hopeful',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    user_id: 1,
    chapter_slug: '01-the-progressive-nature-of-sin',
    note_title: 'The Downward Spiral',
    note_content: `Chapter 1's description of how sin progresses from seemingly innocent beginnings to spiritual deadness is sobering. The analogy of sin as a slippery slope really resonates with me - I can see how easily one compromise leads to another.

Key insights:
- Sin always promises more than it delivers
- Each act of disobedience makes the next one easier
- The heart becomes gradually hardened to God's voice
- Only God's grace can break the cycle

I need to be more vigilant about the "small" compromises that open the door to greater sin.`,
    note_type: 'study',
    tags: JSON.stringify(['progression', 'hardening', 'vigilance', 'grace']),
    is_private: true,
    sentiment: 'convicted',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    user_id: 1,
    chapter_slug: '01-the-progressive-nature-of-sin',
    note_title: 'Practical Application',
    note_content: `After reading this chapter, I'm convicted about my habit of justifying anger and impatience as "just being human." I can see how this attitude has made me less sensitive to these sins over time.

Action steps:
1. Ask my spouse to hold me accountable for my temper
2. Memorize verses about God's patience and kindness
3. Practice the "pause and pray" method when I feel anger rising
4. Keep a journal of triggers and God's faithfulness in helping me respond differently

The chapter's emphasis on early intervention is key - I need to address this before it becomes even more entrenched.`,
    note_type: 'application',
    tags: JSON.stringify(['application', 'anger', 'accountability', 'scripture']),
    is_private: true,
    sentiment: 'determined',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    user_id: 2,
    chapter_slug: '00-preface',
    note_title: 'First Impressions',
    note_content: `I'm grateful my small group is studying this book together. The preface already has me thinking about areas in my life where I've become comfortable with sin. The author's pastoral heart comes through clearly - he's not trying to condemn but to help us see the danger we're in.

Looking forward to diving deeper into this topic with accountability from my group.`,
    note_type: 'reflection',
    tags: JSON.stringify(['gratitude', 'small-group', 'accountability']),
    is_private: false,
    sentiment: 'grateful',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    user_id: 2,
    chapter_slug: '01-the-progressive-nature-of-sin',
    note_title: 'Discussion Questions for Small Group',
    note_content: `Questions to bring up in our small group discussion:

1. How have we seen the progressive nature of sin play out in our own lives or in people we know?
2. What are some "small" sins that our culture (or we personally) tend to dismiss?
3. How can we help each other recognize when we're on a dangerous path?
4. What safeguards can we put in place to avoid the slippery slope?

I'm particularly interested in hearing how others have experienced God's grace in breaking cycles of habitual sin.`,
    note_type: 'discussion',
    tags: JSON.stringify(['small-group', 'questions', 'community']),
    is_private: false,
    sentiment: 'engaging',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  }
];

// Bible verses related to habitual sin (sample data)
const sampleBibleVerses = [
  {
    book: 'Romans',
    chapter: 6,
    verse: 23,
    kjv_text: 'For the wages of sin is death; but the gift of God is eternal life through Jesus Christ our Lord.',
  },
  {
    book: 'Hebrews',
    chapter: 12,
    verse: 1,
    kjv_text: 'Wherefore seeing we also are compassed about with so great a cloud of witnesses, let us lay aside every weight, and the sin which doth so easily beset us, and let us run with patience the race that is set before us,',
  },
  {
    book: 'James',
    chapter: 1,
    verse: 15,
    kjv_text: 'Then when lust hath conceived, it bringeth forth sin: and sin, when it is finished, bringeth forth death.',
  },
  {
    book: '1 John',
    chapter: 1,
    verse: 9,
    kjv_text: 'If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness.',
  },
  {
    book: 'Galatians',
    chapter: 6,
    verse: 1,
    kjv_text: 'Brethren, if a man be overtaken in a fault, ye which are spiritual, restore such an one in the spirit of meekness; considering thyself, lest thou also be tempted.',
  }
];

/**
 * Seed the database with sample data for testing the habitual sin learning module
 */
async function seedHabitualSinData() {
  console.log('🌱 Starting habitual sin data seeding...');

  try {
    // Check if users exist, if not create sample users
    console.log('📝 Checking for existing users...');
    const existingUsers = await db('users').select('id').limit(5);
    
    if (existingUsers.length === 0) {
      console.log('👥 Creating sample users...');
      await db('users').insert(sampleUsers.map(user => ({
        ...user,
        password_hash: '$2a$10$dummy.hash.for.testing.purposes.only',
        created_at: new Date(),
        updated_at: new Date(),
      })));
      console.log(`✅ Created ${sampleUsers.length} sample users`);
    } else {
      console.log(`✅ Found ${existingUsers.length} existing users`);
    }

    // Clear existing reading progress data
    console.log('🗑️  Clearing existing reading progress...');
    await db('reading_progress').del();
    
    // Insert sample reading progress
    console.log('📖 Inserting sample reading progress...');
    await db('reading_progress').insert(sampleReadingProgress.map(progress => ({
      ...progress,
      created_at: new Date(),
      updated_at: new Date(),
    })));
    console.log(`✅ Created ${sampleReadingProgress.length} reading progress records`);

    // Clear existing user notes data
    console.log('🗑️  Clearing existing user notes...');
    await db('user_notes').del();
    
    // Insert sample user notes
    console.log('📝 Inserting sample user notes...');
    await db('user_notes').insert(sampleUserNotes.map(note => ({
      ...note,
      created_at: note.created_at || new Date(),
      updated_at: note.updated_at || new Date(),
    })));
    console.log(`✅ Created ${sampleUserNotes.length} user notes`);

    // Check if bible verses exist, if not create some sample ones
    console.log('📖 Checking bible verses...');
    const existingVerses = await db('bible_verses').select('id').limit(5);
    
    if (existingVerses.length === 0) {
      console.log('📜 Creating sample bible verses...');
      await db('bible_verses').insert(sampleBibleVerses);
      console.log(`✅ Created ${sampleBibleVerses.length} bible verses`);
    } else {
      console.log(`✅ Found ${existingVerses.length} existing bible verses`);
    }

    console.log('🎉 Habitual sin data seeding completed successfully!');
    
    // Display summary
    console.log('\n📊 Summary:');
    const progressCount = await db('reading_progress').count('* as count').first();
    const notesCount = await db('user_notes').count('* as count').first();
    const usersCount = await db('users').count('* as count').first();
    
    console.log(`   Users: ${usersCount.count}`);
    console.log(`   Reading Progress Records: ${progressCount.count}`);
    console.log(`   User Notes: ${notesCount.count}`);
    
  } catch (error) {
    console.error('❌ Error seeding habitual sin data:', error);
    throw error;
  }
}

/**
 * Clear all habitual sin related data
 */
async function clearHabitualSinData() {
  console.log('🧹 Clearing habitual sin data...');
  
  try {
    await db('user_notes').del();
    console.log('✅ Cleared user notes');
    
    await db('reading_progress').del();
    console.log('✅ Cleared reading progress');
    
    console.log('🎉 Habitual sin data cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing habitual sin data:', error);
    throw error;
  }
}

// Script execution logic
async function main() {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'seed':
        await seedHabitualSinData();
        break;
      case 'clear':
        await clearHabitualSinData();
        break;
      case 'reset':
        await clearHabitualSinData();
        await seedHabitualSinData();
        break;
      default:
        console.log('Usage: node scripts/seed-habitual-sin.js [seed|clear|reset]');
        console.log('  seed  - Insert sample data');
        console.log('  clear - Remove all habitual sin data');
        console.log('  reset - Clear and then seed data');
        process.exit(1);
    }
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = {
  seedHabitualSinData,
  clearHabitualSinData,
  sampleUsers,
  sampleReadingProgress,
  sampleUserNotes,
  sampleBibleVerses,
}; 