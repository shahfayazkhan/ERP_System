const { Sequelize } = require('sequelize');
const { Client } = require('pg');
require('dotenv').config();

const dbName = process.env.DB_NAME || 'erp_system';
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || 'postgres';
const dbHost = process.env.DB_HOST || '127.0.0.1';
const dbPort = process.env.DB_PORT || 5432;

async function ensureDatabaseExists() {
  const client = new Client({
    user: dbUser,
    password: dbPassword,
    host: dbHost,
    port: dbPort,
    database: 'postgres',
  });

  try {
    await client.connect();
    // Query to see if the target database exists
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
    if (res.rowCount === 0) {
      console.log(`Database "${dbName}" does not exist. Creating...`);
      // Create the database
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database "${dbName}" created successfully.`);
    } else {
      console.log(`Database "${dbName}" already exists.`);
    }
  } catch (err) {
    console.warn(`Warning: Auto-creation check failed (details: ${err.message}). The server will still attempt to connect.`);
  } finally {
    try {
      await client.end();
    } catch (e) {
      // Ignore cleanup error
    }
  }
}

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: 'postgres',
  logging: false, // toggle to console.log for query debugging
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

module.exports = {
  sequelize,
  ensureDatabaseExists,
};
