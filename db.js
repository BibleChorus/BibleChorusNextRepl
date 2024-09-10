const knex = require('knex');
const knexfile = require('./knexfile');

const db = knex(knexfile);

// Test the connection
db.raw('SELECT 1')
  .then(() => {
    console.log('Database connected successfully');
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
  });

module.exports = db;