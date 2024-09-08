exports.up = function(knex) {
  return knex.schema.createTable('songs', function(table) {
    table.increments('id').primary();
    table.string('title', 255).notNullable();
    table.string('artist', 255);
    table.string('audio_url', 255).notNullable();
    table.integer('uploaded_by').unsigned();
    table.foreign('uploaded_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    
    // New columns
    table.boolean('ai_used_for_lyrics').defaultTo(false);
    table.boolean('music_ai_generated').defaultTo(false);
    table.string('bible_translation_used', 10);
    table.string('genre', 50);
    table.enum('lyrics_scripture_adherence', [
      'The lyrics follow the scripture word-for-word',
      'The lyrics closely follow the scripture passage',
      'The lyrics are creatively inspired by the scripture passage'
    ]).defaultTo('The lyrics closely follow the scripture passage');
    table.boolean('is_continuous_passage').defaultTo(false);
    table.text('lyrics');
    table.text('lyric_ai_prompt');
    table.text('music_ai_prompt');
    table.string('music_model_used', 50);
    table.string('song_art_url', 255);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('songs');
};