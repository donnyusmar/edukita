const { Client } = require('pg');
require('dotenv').config();

async function check() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  
  const res = await client.query('SELECT * FROM student_results WHERE id = 5');
  console.log("Row 5:", JSON.stringify(res.rows[0], null, 2));

  const exercises = await client.query('SELECT * FROM exercises');
  console.log("Exercises:", JSON.stringify(exercises.rows, null, 2));
  
  const chapters = await client.query('SELECT * FROM chapters');
  console.log("Chapters:", JSON.stringify(chapters.rows, null, 2));

  await client.end();
}
check();
