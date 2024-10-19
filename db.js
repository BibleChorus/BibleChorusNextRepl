const knex = require('knex');
const knexfile = require('./knexfile');

const environment = process.env.NODE_ENV || 'development';
const config = knexfile[environment];

console.log('Connecting to database with config:', JSON.stringify(config, null, 2));

const db = knex(config);

module.exports = db;
