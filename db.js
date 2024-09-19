const knex = require('knex');
const path = require('path');

const environment = process.env.NODE_ENV || 'development';
const knexfile = require('./knexfile.js');
const config = knexfile[environment];

if (!config) {
  throw new Error(`No configuration for environment: ${environment}`);
}

if (!config.client) {
  throw new Error(`Missing 'client' configuration for environment: ${environment}`);
}

console.log('Knex configuration:', JSON.stringify(config, null, 2));

const db = knex(config);

// Test the connection
db.raw('SELECT 1')
  .then(() => {
    console.log('Database connected successfully');
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
  });

module.exports = db;