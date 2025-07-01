exports.up = function(knex) {
  return knex.schema.createTable('forum_votes', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.integer('topic_id').unsigned().nullable();
    table.integer('comment_id').unsigned().nullable();
    table.integer('vote_value').notNullable().checkIn([-1, 1]); // -1 for downvote, 1 for upvote
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    
    // Ensure either topic_id or comment_id is set, but not both
    table.check('(topic_id IS NOT NULL AND comment_id IS NULL) OR (topic_id IS NULL AND comment_id IS NOT NULL)');
    
    // Unique constraint to prevent duplicate votes
    table.unique(['user_id', 'topic_id']);
    table.unique(['user_id', 'comment_id']);
    
    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('topic_id').references('id').inTable('forum_topics').onDelete('CASCADE');
    table.foreign('comment_id').references('id').inTable('forum_comments').onDelete('CASCADE');
    
    // Indexes for performance
    table.index(['topic_id']);
    table.index(['comment_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('forum_votes');
};