const { Sequelize } = require('sequelize');
const { Client } = require('pg');
const path = require('path');
const child_process = require('child_process');
require('dotenv').config();

const dbName = process.env.DB_NAME || 'erp_system';
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || 'postgres';
const dbHost = process.env.DB_HOST || '127.0.0.1';
const dbPort = Number(process.env.DB_PORT) || 5432;

let dialect = 'postgres';

// Auto-detect local Postgres availability
if (dbHost === '127.0.0.1' || dbHost === 'localhost') {
  try {
    // Try to listen on the port. If successful (exit code 0), port is free, so Postgres is not running.
    child_process.execSync(
      `node -e "const s = require('net').createServer(); s.on('error', () => process.exit(1)); s.listen(${dbPort}, '${dbHost}', () => { s.close(); process.exit(0); })"`, 
      { timeout: 2000 }
    );
    console.log(`Port ${dbPort} is free. No PostgreSQL server detected on ${dbHost}:${dbPort}.`);
    dialect = 'sqlite';
  } catch (err) {
    // If it failed (exit code 1), port is occupied, so PostgreSQL is running there.
    console.log(`Port ${dbPort} is occupied. PostgreSQL server detected on ${dbHost}:${dbPort}.`);
    dialect = 'postgres';
  }
} else {
  // Remote host connection: assume PostgreSQL is running there.
  dialect = 'postgres';
}

let sequelize;

if (dialect === 'sqlite') {
  console.log('⚡ Database Connection: SQLite (Self-Contained Local File erp.sqlite)');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', '..', 'erp.sqlite'),
    logging: false
  });
} else {
  console.log(`🐘 Database Connection: PostgreSQL (Target: ${dbHost}:${dbPort}, DB: ${dbName})`);
  sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
}

async function ensureDatabaseExists() {
  if (dialect === 'sqlite') {
    return; // SQLite creates the database file automatically on sync.
  }

  const client = new Client({
    user: dbUser,
    password: dbPassword,
    host: dbHost,
    port: dbPort,
    database: 'postgres',
  });

  try {
    await client.connect();
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
    if (res.rowCount === 0) {
      console.log(`Database "${dbName}" does not exist. Creating...`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database "${dbName}" created successfully.`);
    }
  } catch (err) {
    console.warn(`Warning: Could not auto-create database (details: ${err.message}). Connecting anyway.`);
  } finally {
    try {
      await client.end();
    } catch (e) {
      // Ignore cleanup error
    }
  }
}

module.exports = {
  sequelize,
  ensureDatabaseExists,
};
