/**
 * Migration: Create reading_progress table
 * Tracks user progress through book chapters including completion and quiz scores
 */

exports.up = function(knex) {
  return knex.schema.createTable('reading_progress', table => {
    // Primary key
    table.increments('id').primary();
    
    // Foreign key to users table
    table.integer('user_id')
      .unsigned()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .notNullable();
    
    // Chapter identifier (slug from MDX frontmatter)
    table.string('chapter_slug', 100).notNullable();
    
    // Progress tracking fields
    table.timestamp('started_at').defaultTo(knex.fn.now());
    table.timestamp('completed_at').nullable();
    table.integer('reading_time_seconds').defaultTo(0); // Time spent reading
    table.integer('scroll_progress_percent').defaultTo(0); // How far they scrolled
    
    // Quiz related fields
    table.integer('quiz_score').nullable(); // Percentage score on quiz
    table.integer('quiz_attempts').defaultTo(0); // Number of quiz attempts
    table.timestamp('quiz_completed_at').nullable();
    table.json('quiz_answers').nullable(); // Store quiz responses for analysis
    
    // Additional engagement metrics
    table.integer('visit_count').defaultTo(1); // Number of times visited this chapter
    table.timestamp('last_visited_at').defaultTo(knex.fn.now());
    
    // Timestamps
    table.timestamps(true, true); // created_at, updated_at
    
    // Indexes for performance
    table.index(['user_id', 'chapter_slug'], 'reading_progress_user_chapter_idx');
    table.index(['user_id', 'completed_at'], 'reading_progress_user_completion_idx');
    table.index('chapter_slug', 'reading_progress_chapter_idx');
    
    // Unique constraint - one progress record per user per chapter
    table.unique(['user_id', 'chapter_slug'], 'reading_progress_user_chapter_unique');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('reading_progress');
}; 