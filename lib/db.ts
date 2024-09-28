import knex from 'knex';

const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  pool: { min: 0, max: 7 }
});

export { db as knex };