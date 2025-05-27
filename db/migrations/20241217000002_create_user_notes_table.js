/**
 * Migration: Create user_notes table
 * Stores user reflection journal entries for book chapters
 */

exports.up = function(knex) {
  return knex.schema.createTable('user_notes', table => {
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
    
    // Note content and metadata
    table.text('note').notNullable(); // The actual note content
    table.string('note_type', 50).defaultTo('reflection'); // reflection, question, insight, etc.
    table.boolean('is_private').defaultTo(true); // Whether note is private to user
    table.boolean('is_favorite').defaultTo(false); // User can mark important notes
    
    // Optional verse reference if note relates to specific verse
    table.string('verse_reference', 100).nullable();
    
    // Content analysis (for future AI features)
    table.json('tags').nullable(); // Auto-generated or user tags
    table.string('sentiment', 20).nullable(); // positive, negative, neutral
    table.integer('word_count').defaultTo(0);
    
    // Timestamps
    table.timestamps(true, true); // created_at, updated_at
    
    // Indexes for performance
    table.index(['user_id', 'chapter_slug'], 'user_notes_user_chapter_idx');
    table.index(['user_id', 'created_at'], 'user_notes_user_date_idx');
    table.index(['user_id', 'is_favorite'], 'user_notes_user_favorites_idx');
    table.index('chapter_slug', 'user_notes_chapter_idx');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('user_notes');
}; 