import knex from 'knex';

// Initialize the Knex instance
const db = knex({
  client: 'pg',
  connection: process.env.PGDATABASE ? {
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    ssl: { rejectUnauthorized: false },
  } : process.env.DATABASE_URL, // Adjust for your environment
  pool: { min: 0, max: 7 },
});

// Export the database client
export default db;
