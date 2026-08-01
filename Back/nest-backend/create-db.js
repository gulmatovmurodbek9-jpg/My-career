const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'murodbek65',
  port: 5432,
});

async function createDatabase() {
  try {
    await client.connect();
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'career_db'");
    if (res.rowCount === 0) {
      await client.query('CREATE DATABASE career_db');
      console.log('Database career_db created successfully');
    } else {
      console.log('Database career_db already exists');
    }
  } catch (err) {
    console.error('Error creating database:', err);
  } finally {
    await client.end();
  }
}

createDatabase();
