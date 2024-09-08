exports.up = function(knex) {
  return knex.schema.createTable('lyric_videos', function(table) {
    table.increments('id').primary();
    table.string('video_url', 255).notNullable();
    table.string('thumbnail_url', 255);
    table.integer('duration').unsigned();
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.integer('uploaded_by').unsigned();
    table.foreign('uploaded_by').references('id').inTable('users').onDelete('SET NULL');
    table.boolean('ai_generated').defaultTo(false);
    table.string('ai_model_used', 50);
    table.text('ai_prompt');
    // New columns
    table.string('video_style', 50);
    table.boolean('includes_scripture_references').defaultTo(false);
    table.string('language', 50);
    table.boolean('has_subtitles').defaultTo(false);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('lyric_videos');
};