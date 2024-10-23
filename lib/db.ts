import knex from 'knex';
import knexConfig from '@/knexfile';

// Import environment configuration
const environment = process.env.NODE_ENV || 'development';

// Initialize the Knex instance with the appropriate environment config
const db = knex(knexConfig[environment]);

// Export the database client
export default db;
