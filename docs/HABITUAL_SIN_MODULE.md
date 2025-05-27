# Habitual Sin Learning Module

## Overview

The Habitual Sin Learning Module is an interactive educational sub-site within BibleChorus that helps users study "The Eternal Danger of Habitual Sin" through reading, reflection, testing, and progress tracking. The module provides a comprehensive learning experience with features designed to promote spiritual growth and accountability.

## Features

### 📚 Interactive Reading Experience
- **MDX-powered content**: Rich text with embedded Scripture references
- **Scroll-based progress tracking**: Real-time reading progress updates
- **Verse pop-overs**: Hover over Bible references to see verse text
- **Responsive design**: Optimized for desktop and mobile devices
- **Dark/Light mode support**: Seamless theme integration

### 🧠 Auto-Generated Quizzes
- **Multiple question types**: Multiple choice, true/false, fill-in-blank, short answer
- **Intelligent content analysis**: Questions generated from chapter content
- **Difficulty levels**: Easy, medium, and hard questions
- **Category-based questions**: Content, verse, application, and doctrine
- **Performance tracking**: Scores, time spent, and attempt history

### 📝 Reflection Journal
- **Rich text editing**: Write detailed reflections on each chapter
- **Mood tracking**: Tag entries with emotional states
- **Tag system**: Organize notes with custom tags
- **Search and filtering**: Find specific notes easily
- **Privacy controls**: Public or private note settings

### 🃏 Flashcard System
- **Spaced repetition**: Algorithm-based review scheduling
- **Multiple categories**: Verses, concepts, definitions, applications
- **Performance tracking**: Accuracy and review statistics
- **Customizable sessions**: Filter by difficulty or category

### 📊 Progress Tracking
- **Comprehensive analytics**: Reading time, quiz scores, note counts
- **Streak tracking**: Daily activity monitoring
- **Chapter completion**: Visual progress indicators
- **Performance insights**: Detailed statistics and trends

### 🎯 Sidebar Navigation
- **Chapter overview**: Quick access to all chapters
- **Progress visualization**: Color-coded status indicators
- **Quick actions**: Direct links to quizzes and notes
- **Statistics dashboard**: Overview of learning progress

## Architecture

### File Structure
```
/pages/learn/habitual-sin/
├── index.tsx                    # Landing page and progress dashboard
├── [chapterSlug]/
│   ├── index.tsx               # Chapter reading page
│   └── quiz.tsx                # Chapter quiz page

/components/habitual-sin/
├── Sidebar.tsx                 # Navigation and progress sidebar
├── Flashcards.tsx              # Interactive flashcard component
└── Journal.tsx                 # Reflection journal interface

/content/habitual-sin/
├── index.json                  # Chapter metadata
├── 00-preface.mdx             # Preface content
├── 01-the-progressive-nature-of-sin.mdx
└── ... (additional chapters)

/hooks/
├── useProgress.tsx             # Progress state management
└── useUser.ts                  # User authentication wrapper

/lib/
└── quizGenerator.ts            # Quiz generation logic

/pages/api/learn/
├── progress.ts                 # Reading/quiz progress API
└── notes.ts                    # User notes API

/db/migrations/
├── 20241217000001_create_reading_progress_table.js
└── 20241217000002_create_user_notes_table.js

/scripts/
├── convert-habitual-sin.js     # Convert Word docs to MDX
└── seed-habitual-sin.js        # Database seeding

/__tests__/habitual-sin/
├── quiz-generator.test.js      # Quiz functionality tests
└── progress-api.test.js        # API endpoint tests
```

### Database Schema

#### reading_progress table
Tracks user progress through chapters including reading and quiz completion.

```sql
CREATE TABLE reading_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  chapter_slug VARCHAR(255) NOT NULL,
  reading_started_at TIMESTAMP,
  last_read_at TIMESTAMP,
  reading_completed_at TIMESTAMP,
  progress_percentage INTEGER DEFAULT 0,
  time_spent_reading INTEGER DEFAULT 0,
  reading_completed BOOLEAN DEFAULT FALSE,
  quiz_started_at TIMESTAMP,
  quiz_completed_at TIMESTAMP,
  quiz_score INTEGER,
  quiz_time_spent INTEGER DEFAULT 0,
  quiz_attempts INTEGER DEFAULT 0,
  quiz_completed BOOLEAN DEFAULT FALSE,
  quiz_answers JSONB,
  notes_count INTEGER DEFAULT 0,
  reflection_completed BOOLEAN DEFAULT FALSE,
  last_activity_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### user_notes table
Stores user reflections and journal entries for each chapter.

```sql
CREATE TABLE user_notes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  chapter_slug VARCHAR(255) NOT NULL,
  note_title VARCHAR(500) NOT NULL,
  note_content TEXT NOT NULL,
  note_type VARCHAR(50) DEFAULT 'reflection',
  tags JSONB,
  is_private BOOLEAN DEFAULT TRUE,
  sentiment VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints

#### Progress API (`/api/learn/progress`)
- **GET**: Retrieve user progress for a specific chapter or all chapters
- **POST**: Create new progress record
- **PUT**: Update existing progress (reading completion, quiz scores, etc.)

#### Notes API (`/api/learn/notes`)
- **GET**: Retrieve user notes, optionally filtered by chapter
- **POST**: Create new reflection note
- **PUT**: Update existing note
- **DELETE**: Remove note

## Setup and Installation

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Next.js 14+ project setup

### Installation Steps

1. **Install Dependencies**
   ```bash
   npm install @mdx-js/loader @mdx-js/react @next/mdx
   npm install mammoth remark remark-mdx  # For content conversion
   npm install framer-motion lucide-react  # For UI components
   ```

2. **Database Setup**
   ```bash
   # Run database migrations
   npm run migrate
   
   # Seed with sample data (optional)
   npm run seed:habitual-sin seed
   ```

3. **Content Setup**
   ```bash
   # Convert Word documents to MDX (if you have source docs)
   npm run convert:habitual-sin
   ```

4. **Configure Next.js**
   Update `next.config.js` to support MDX:
   ```javascript
   const withMDX = require('@next/mdx')({
     extension: /\.mdx?$/,
     options: {
       remarkPlugins: [],
       rehypePlugins: [],
     },
   });

   module.exports = withMDX({
     pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
   });
   ```

## Usage Guide

### For End Users

#### Getting Started
1. Navigate to `/learn/habitual-sin`
2. Sign in to track your progress
3. Start with the Preface
4. Complete reading → Take quiz → Write reflection

#### Reading a Chapter
- Progress is automatically tracked as you scroll
- Hover over Bible references to see verse text
- Use the sidebar to navigate between chapters
- Toggle audio mode for listening experience (if implemented)

#### Taking Quizzes
- Access via chapter page or sidebar link
- Multiple question types test different aspects
- Immediate feedback with explanations
- Retake anytime to improve scores

#### Writing Reflections
- Click "New Entry" in the journal
- Add tags and mood indicators
- Use search and filters to find past entries
- Share publicly or keep private

#### Using Flashcards
- Access from sidebar or main dashboard
- Choose difficulty levels and categories
- Track performance over time
- Spaced repetition for optimal learning

### For Developers

#### Adding New Chapters
1. Create MDX file in `/content/habitual-sin/`
2. Add frontmatter with metadata
3. Update `index.json` with chapter info
4. Test quiz generation and progress tracking

#### Customizing Quiz Generation
Modify `/lib/quizGenerator.ts`:
- Adjust question distribution
- Add new question types
- Customize difficulty algorithms
- Enhance content parsing

#### Extending Progress Tracking
Update `/hooks/useProgress.tsx`:
- Add new metrics
- Customize tracking logic
- Integrate with analytics
- Add notification systems

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test files
npm test habitual-sin
```

### Test Coverage
- **Quiz Generator**: Question generation, scoring, validation
- **Progress API**: CRUD operations, authentication, data validation
- **Component Integration**: User interactions, state management
- **Database Operations**: Migration scripts, seeding

### Manual Testing Checklist
- [ ] Chapter reading and progress tracking
- [ ] Quiz generation and completion
- [ ] Note creation and management
- [ ] Flashcard sessions
- [ ] Sidebar navigation
- [ ] Mobile responsiveness
- [ ] Dark/light mode switching
- [ ] Authentication flows

## Performance Considerations

### Optimization Strategies
- **Static Generation**: Pre-render chapter pages at build time
- **Code Splitting**: Lazy load components for better performance
- **Image Optimization**: Use Next.js Image component for chapter assets
- **Database Indexing**: Optimize queries with proper indexes
- **Caching**: Implement Redis for session and progress data

### Monitoring
- Track page load times
- Monitor database query performance
- Log user engagement metrics
- Alert on error rates

## Security

### Data Protection
- **JWT Authentication**: Secure API access
- **Input Sanitization**: Prevent XSS attacks in user content
- **SQL Injection Prevention**: Parameterized queries
- **Rate Limiting**: Prevent API abuse
- **Privacy Controls**: User data isolation and privacy settings

### Best Practices
- Regular security audits
- Dependency vulnerability scanning
- Secure configuration management
- User consent for data collection

## Future Enhancements

### Planned Features
- **Audio Integration**: Narrated chapter content
- **Social Features**: Group study capabilities
- **Advanced Analytics**: Learning pattern insights
- **Mobile App**: React Native companion
- **Gamification**: Achievements and leaderboards
- **AI Integration**: Personalized study recommendations

### Community Features
- Discussion forums for each chapter
- Peer accountability partnerships
- Study group creation and management
- Mentor assignment system

## Troubleshooting

### Common Issues

#### Quiz not generating
- Check MDX content format
- Verify Bible verse patterns
- Review quizGenerator.ts logs

#### Progress not saving
- Confirm user authentication
- Check database connectivity
- Verify API endpoint responses

#### Sidebar not loading
- Check chapter index.json format
- Verify progress data structure
- Review component error logs

### Debug Mode
Enable debug logging:
```javascript
// In your environment variables
DEBUG_HABITUAL_SIN=true
```

### Support
For issues or questions:
1. Check the troubleshooting guide
2. Review test output
3. Check browser console for errors
4. Verify database and API connectivity

## Contributing

### Development Workflow
1. Create feature branch
2. Implement changes with tests
3. Update documentation
4. Submit pull request
5. Code review and testing
6. Merge and deploy

### Code Standards
- TypeScript for type safety
- Jest for testing
- ESLint for code quality
- Prettier for formatting
- Component documentation

## License

This module is part of the BibleChorus project and follows the same licensing terms. 