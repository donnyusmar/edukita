const { Client } = require('pg');
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

    // 1. Create or Get 'Hafalan Perkalian 1-10' Subject
    let subjectId;
    const subCheck = await client.query("SELECT id FROM subjects WHERE name = 'Hafalan Perkalian 1-10'");
    if (subCheck.rows.length > 0) {
      subjectId = subCheck.rows[0].id;
      console.log(`Using existing subject 'Hafalan Perkalian 1-10' with ID: ${subjectId}`);
    } else {
      const subInsert = await client.query(`
        INSERT INTO subjects (name, description, icon, is_active)
        VALUES ('Hafalan Perkalian 1-10', 'Latihan berjenjang untuk menghafal perkalian 1 sampai dengan 10 secara terstruktur dan teratur.', 'Calculator', true)
        RETURNING id;
      `);
      subjectId = subInsert.rows[0].id;
      console.log(`Created new subject 'Hafalan Perkalian 1-10' with ID: ${subjectId}`);
    }

    // 2. Loop through multiplication 1 to 10
    for (let n = 1; n <= 10; n++) {
      console.log(`Seeding Perkalian ${n}...`);
      
      // Create Chapter
      const chapRes = await client.query(`
        INSERT INTO chapters (subject_id, title, order_number)
        VALUES ($1, $2, $3)
        RETURNING id;
      `, [subjectId, `Perkalian ${n}`, n]);
      const chapterId = chapRes.rows[0].id;

      // Create Theory Content: Ordered list
      let theoryLines = [];
      for (let i = 1; i <= 10; i++) {
        theoryLines.push(`${n} x ${i} = ${n * i}`);
      }
      const theoryContent = `Berikut adalah daftar urut tabel Perkalian ${n} untuk kamu hafalkan:\n\n${theoryLines.join('\n')}\n\nHafalkan tabel di atas secara berurutan, lalu uji kemampuan hafalan acakmu pada menu Latihan Soal di samping!`;

      await client.query(`
        INSERT INTO theories (chapter_id, title, content)
        VALUES ($1, $2, $3);
      `, [chapterId, `Tabel Perkalian ${n} Urut`, theoryContent]);

      // Create Exercise
      const exRes = await client.query(`
        INSERT INTO exercises (chapter_id, title)
        VALUES ($1, $2)
        RETURNING id;
      `, [chapterId, `Kuis Acak Perkalian ${n}`]);
      const exerciseId = exRes.rows[0].id;

      // Create 5 randomized questions for table N
      // We will pick 5 random multipliers from 1-10
      const multipliers = [2, 4, 6, 7, 9]; // Fixed diverse multipliers
      for (const m of multipliers) {
        const correctResult = n * m;
        const questionText = `Berapakah hasil perkalian dari ${n} x ${m}?`;
        
        // Generate options (one correct, three incorrect but realistic)
        const incorrect1 = correctResult + n;
        const incorrect2 = correctResult - n > 0 ? correctResult - n : correctResult + (n * 2);
        const incorrect3 = correctResult + 5;
        
        // Ensure options are unique
        const optionsSet = new Set([
          correctResult.toString(),
          incorrect1.toString(),
          incorrect2.toString(),
          incorrect3.toString()
        ]);
        
        // If set size < 4 (e.g. for small numbers), fill up
        let offset = 1;
        while (optionsSet.size < 4) {
          optionsSet.add((correctResult + offset).toString());
          offset++;
        }

        const optionsArray = Array.from(optionsSet);
        // Shuffle options
        optionsArray.sort(() => Math.random() - 0.5);

        await client.query(`
          INSERT INTO questions (exercise_id, question_text, options, correct_answer)
          VALUES ($1, $2, $3::jsonb, $4);
        `, [exerciseId, questionText, JSON.stringify(optionsArray), correctResult.toString()]);
      }
    }

    console.log("All 10 multiplication tables, theories, quizzes, and questions seeded successfully!");

  } catch (err) {
    console.error("Error executing db-perkalian-lengkap script:", err);
  } finally {
    await client.end();
  }
}

run();
