exports.up = async function(knex) {
  await knex.schema.createTable('pdfs', function(table) {
    table.increments('id').primary();
    table.string('title', 255).notNullable();
    table.string('author', 255);
    table.string('file_url', 255).notNullable();
    table.integer('uploaded_by').unsigned().notNullable();
    table
      .foreign('uploaded_by')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.boolean('ai_assisted').notNullable().defaultTo(false);
    table.specificType('themes', 'text[]').notNullable().defaultTo('{}');
    table.text('description');
    table.boolean('is_public').notNullable().defaultTo(true);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.index('uploaded_by', 'pdfs_uploaded_by_idx');
    table.index('created_at', 'pdfs_created_at_idx');
  });

  await knex.schema.createTable('pdf_verses', function(table) {
    table.integer('pdf_id').unsigned().notNullable();
    table.integer('verse_id').unsigned().notNullable();
    table
      .foreign('pdf_id')
      .references('id')
      .inTable('pdfs')
      .onDelete('CASCADE');
    table
      .foreign('verse_id')
      .references('id')
      .inTable('bible_verses')
      .onDelete('CASCADE');
    table.primary(['pdf_id', 'verse_id']);
  });

  await knex.schema.createTable('pdf_comments', function(table) {
    table.increments('id').primary();
    table.integer('pdf_id').unsigned().notNullable();
    table.integer('user_id').unsigned().notNullable();
    table.text('comment').notNullable();
    table.integer('page_number');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.integer('parent_comment_id').unsigned();
    table.boolean('is_pinned').defaultTo(false);
    table.boolean('is_approved').defaultTo(true);
    table.boolean('is_edited').defaultTo(false);
    table
      .foreign('pdf_id')
      .references('id')
      .inTable('pdfs')
      .onDelete('CASCADE');
    table
      .foreign('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table
      .foreign('parent_comment_id')
      .references('id')
      .inTable('pdf_comments')
      .onDelete('SET NULL');
    table.index('pdf_id', 'pdf_comments_pdf_id_idx');
    table.index('parent_comment_id', 'pdf_comments_parent_comment_id_idx');
    table.index('user_id', 'pdf_comments_user_id_idx');
  });

  await knex.schema.createTable('pdf_notes', function(table) {
    table.increments('id').primary();
    table.integer('pdf_id').unsigned().notNullable();
    table.integer('user_id').unsigned().notNullable();
    table.text('note').notNullable();
    table.integer('page_number');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table
      .foreign('pdf_id')
      .references('id')
      .inTable('pdfs')
      .onDelete('CASCADE');
    table
      .foreign('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.index(['pdf_id', 'user_id'], 'pdf_notes_pdf_user_idx');
  });

  await knex.schema.createTable('pdf_ratings', function(table) {
    table.increments('id').primary();
    table.integer('pdf_id').unsigned().notNullable();
    table.integer('user_id').unsigned().notNullable();
    table.smallint('quality').defaultTo(0);
    table.smallint('theology').defaultTo(0);
    table.smallint('helpfulness').defaultTo(0);
    table
      .foreign('pdf_id')
      .references('id')
      .inTable('pdfs')
      .onDelete('CASCADE');
    table
      .foreign('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.unique(['pdf_id', 'user_id']);
  });

  await knex.schema.table('bible_verses', function(table) {
    table.specificType('all_pdf_ids', 'integer[]').defaultTo('{}');
    table.specificType('ai_content_pdf_ids', 'integer[]').defaultTo('{}');
    table.specificType('human_content_pdf_ids', 'integer[]').defaultTo('{}');
    table.jsonb('theme_pdf_ids').defaultTo('{}');
    table.index('all_pdf_ids', 'bible_verses_all_pdfs_idx', 'GIN');
    table.index('ai_content_pdf_ids', 'bible_verses_ai_content_pdfs_idx', 'GIN');
    table.index('human_content_pdf_ids', 'bible_verses_human_content_pdfs_idx', 'GIN');
    table.index('theme_pdf_ids', 'bible_verses_theme_pdfs_idx', 'GIN');
  });
};

exports.down = async function(knex) {
  await knex.schema.table('bible_verses', function(table) {
    table.dropIndex('', 'bible_verses_all_pdfs_idx');
    table.dropIndex('', 'bible_verses_ai_content_pdfs_idx');
    table.dropIndex('', 'bible_verses_human_content_pdfs_idx');
    table.dropIndex('', 'bible_verses_theme_pdfs_idx');
    table.dropColumn('all_pdf_ids');
    table.dropColumn('ai_content_pdf_ids');
    table.dropColumn('human_content_pdf_ids');
    table.dropColumn('theme_pdf_ids');
  });

  await knex.schema.dropTableIfExists('pdf_ratings');
  await knex.schema.dropTableIfExists('pdf_notes');
  await knex.schema.dropTableIfExists('pdf_comments');
  await knex.schema.dropTableIfExists('pdf_verses');
  await knex.schema.dropTableIfExists('pdfs');
};
