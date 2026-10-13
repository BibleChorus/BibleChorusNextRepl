/** Additive only; deployment applies this migration explicitly after target verification. */
exports.up = async function(knex) {
  await knex.schema.createTable('journey_originals', table => {
    table.increments('id').primary();
    table.integer('journey_entry_id').notNullable()
      .references('id').inTable('journey_season_songs').onDelete('CASCADE');
    table.integer('owner_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('request_id').notNullable();
    table.string('request_digest', 64).notNullable();
    table.string('kind', 16).notNullable();
    table.string('label', 120).notNullable();
    table.integer('display_order').notNullable().defaultTo(0);
    table.boolean('is_shared').notNullable().defaultTo(false);
    table.string('status', 16).notNullable().defaultTo('pending');
    table.text('journal_text');
    table.string('file_name', 255);
    table.string('mime_type', 100);
    table.integer('byte_size');
    table.string('storage_bucket', 255);
    table.string('upload_key', 512);
    table.string('object_key', 512);
    table.timestamps(true, true);
    table.index(['journey_entry_id', 'display_order']);
    table.index('owner_id');
    table.unique('object_key');
    table.unique('upload_key');
    table.unique(['owner_id', 'request_id']);
    table.check("kind IN ('audio', 'journal', 'image', 'pdf')", [], 'journey_originals_kind_check');
    table.check("status IN ('pending', 'ready')", [], 'journey_originals_status_check');
    table.check('display_order >= 0', [], 'journey_originals_display_order_check');
    table.check('byte_size IS NULL OR byte_size > 0', [], 'journey_originals_byte_size_check');
    table.check("status = 'ready' OR is_shared = false", [], 'journey_originals_sharing_check');
    table.check("(kind = 'journal' AND journal_text IS NOT NULL AND status = 'ready' AND storage_bucket IS NULL AND object_key IS NULL AND upload_key IS NULL) OR (kind <> 'journal' AND journal_text IS NULL AND storage_bucket IS NOT NULL AND upload_key IS NOT NULL AND mime_type IS NOT NULL AND byte_size IS NOT NULL AND (status <> 'ready' OR object_key IS NOT NULL))", [], 'journey_originals_payload_check');
  });
};

// Rollback intentionally retains originals. Removing a feature must not erase personal material.
exports.down = async function() {};
