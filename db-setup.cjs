const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set in the environment or .env file.");
  process.exit(1);
}

async function run() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL database on Neon.");

    // Create Tables
    console.log("Creating tables...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        icon VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS chapters (
        id SERIAL PRIMARY KEY,
        subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        order_number INT NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS theories (
        id SERIAL PRIMARY KEY,
        chapter_id INT REFERENCES chapters(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS exercises (
        id SERIAL PRIMARY KEY,
        chapter_id INT REFERENCES chapters(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        exercise_id INT REFERENCES exercises(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        options JSONB NOT NULL,
        correct_answer VARCHAR(10) NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS student_results (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        exercise_id INT REFERENCES exercises(id) ON DELETE CASCADE,
        score INT NOT NULL,
        answers JSONB NOT NULL,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS badges (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        icon VARCHAR(100) NOT NULL,
        condition_type VARCHAR(100) NOT NULL,
        condition_value VARCHAR(100) NOT NULL,
        subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT TRUE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS student_badges (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        badge_id INT REFERENCES badges(id) ON DELETE CASCADE,
        earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Tables created successfully.");

    // Seed users
    console.log("Seeding users...");
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("password123", salt);

    // Admin user
    await client.query(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES ('Admin Edukita', 'admin@test.com', $1, 'admin')
      ON CONFLICT (email) DO NOTHING;
    `, [passwordHash]);

    // Student user
    await client.query(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES ('Murid Edukita', 'murid@test.com', $1, 'murid')
      ON CONFLICT (email) DO NOTHING;
    `, [passwordHash]);

    // Seed default subject
    console.log("Seeding subjects...");
    const subjectRes = await client.query(`
      INSERT INTO subjects (name, description, icon, is_active)
      VALUES ('Matematika Dasar', 'Belajar Matematika Dasar dari Nol seperti Aljabar dan Aritmatika.', 'Calculator', true)
      RETURNING id;
    `);

    if (subjectRes.rows.length > 0) {
      const subjectId = subjectRes.rows[0].id;

      // Seed chapters
      console.log("Seeding chapters...");
      const chapterRes = await client.query(`
        INSERT INTO chapters (subject_id, title, order_number)
        VALUES ($1, 'Aljabar Sederhana', 1)
        RETURNING id;
      `, [subjectId]);

      if (chapterRes.rows.length > 0) {
        const chapterId = chapterRes.rows[0].id;

        // Seed theory
        console.log("Seeding theories...");
        await client.query(`
          INSERT INTO theories (chapter_id, title, content)
          VALUES ($1, 'Pengenalan Aljabar', 'Aljabar adalah cabang matematika yang memanipulasi simbol-simbol matematika untuk menemukan variabel yang tidak diketahui. Simbol yang paling sering digunakan adalah x dan y. Contoh sederhana: x + 2 = 5, maka nilai x adalah 3.')
        `, [chapterId]);

        // Seed exercise
        console.log("Seeding exercises...");
        const exerciseRes = await client.query(`
          INSERT INTO exercises (chapter_id, title)
          VALUES ($1, 'Latihan Aljabar Dasar')
          RETURNING id;
        `, [chapterId]);

        if (exerciseRes.rows.length > 0) {
          const exerciseId = exerciseRes.rows[0].id;

          // Seed questions
          console.log("Seeding questions...");
          const optionsQ1 = JSON.stringify(["1", "2", "3", "4"]);
          const optionsQ2 = JSON.stringify(["2", "4", "6", "8"]);

          await client.query(`
            INSERT INTO questions (exercise_id, question_text, options, correct_answer)
            VALUES 
            ($1, 'Jika x + 5 = 8, berapakah nilai x?', $2, '3'),
            ($1, 'Jika 2y = 12, berapakah nilai y?', $3, '6')
          `, [exerciseId, optionsQ1, optionsQ2]);
        }
      }

      // Seed badges
      console.log("Seeding badges...");
      await client.query(`
        INSERT INTO badges (name, icon, condition_type, condition_value, subject_id, is_active)
        VALUES 
        ('Penjelajah Matematika', 'Award', 'perfect_score', '100', $1, true),
        ('Pahlawan Aljabar', 'Star', 'complete_exercise', '1', $1, true)
      `, [subjectId]);
    }

    console.log("Database seeded successfully.");
  } catch (err) {
    console.error("Error running DB setup script:", err);
  } finally {
    await client.end();
  }
}

run();
