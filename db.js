const knex = require('knex');
const knexfile = require('./knexfile');
const environment = process.env.NODE_ENV || 'development';
// Development hot reload must not create a new PostgreSQL pool on every edit.
/** @type {import('knex').Knex} */
const db = globalThis.__bibleChorusDb || knex(knexfile[environment]);
if (environment !== 'production') globalThis.__bibleChorusDb = db;
module.exports = db;
