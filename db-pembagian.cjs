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

    // 1. Get or create Matematika Dasar subject
    let subjectId;
    const subCheck = await client.query("SELECT id FROM subjects WHERE name = 'Matematika Dasar'");
    if (subCheck.rows.length > 0) {
      subjectId = subCheck.rows[0].id;
      console.log(`Using existing subject 'Matematika Dasar' with ID: ${subjectId}`);
    } else {
      const subInsert = await client.query(`
        INSERT INTO subjects (name, description, icon, is_active)
        VALUES ('Matematika Dasar', 'Belajar Matematika Dasar dari Nol seperti Aljabar dan Aritmatika.', 'Calculator', true)
        RETURNING id;
      `);
      subjectId = subInsert.rows[0].id;
      console.log(`Created new subject 'Matematika Dasar' with ID: ${subjectId}`);
    }

    // 2. Create Chapter 3: Trik & Hafalan Pembagian 1-10
    console.log("Creating Chapter 3...");
    const chapRes = await client.query(`
      INSERT INTO chapters (subject_id, title, order_number)
      VALUES ($1, 'Trik & Hafalan Pembagian 1-10', 3)
      RETURNING id;
    `, [subjectId]);
    const chapterId = chapRes.rows[0].id;

    // 3. Create Theory for Chapter 3
    console.log("Creating theory content...");
    await client.query(`
      INSERT INTO theories (chapter_id, title, content)
      VALUES ($1, 'Cara Cepat Menghafal Pembagian', 
      'Pembagian sebenarnya adalah kebalikan dari perkalian. Untuk menguasai pembagian 1 sampai 10 dengan cepat, gunakan trik-trik praktis berikut:\n\n1. SEBAGAI KEBALIKAN PERKALIAN (Inverse Operation)\nJika kamu sudah menghafal perkalian, pembagian akan terasa sangat mudah. \nContohnya: Jika kamu tahu 2 x 7 = 14, maka secara otomatis:\n- 14 / 7 = 2\n- 14 / 2 = 7\nCukup balikkan cara berpikirmu dari perkalian untuk menyelesaikan pembagian!\n\n2. POLA PEMBAGIAN ANGKA 5\nUntuk angka yang berakhiran 0 atau 5, pembagian dengan 5 memiliki pola unik:\n- Setiap pembagian angka puluhan genap dengan 5 akan menghasilkan angka genap (misal: 20 / 5 = 4, 40 / 5 = 8).\n- Setiap pembagian angka puluhan ganjil dengan 5 akan menghasilkan angka ganjil (misal: 10 / 5 = 2, 30 / 5 = 6 -- angka 2 dan 6 adalah kelipatan genap dari hasil bagi setengah angka puluhannya, sedangkan 15 / 5 = 3, 25 / 5 = 5).\n\n3. TRIK MEMBAGI DENGAN ANGKA 10\nIni adalah pembagian paling mudah! Jika membagi bilangan kelipatan 10 dengan angka 10, kamu hanya perlu menghilangkan angka nol di belakangnya.\nContoh:\n- 80 / 10 = 8\n- 100 / 10 = 10\n- 50 / 10 = 5');
    `, [chapterId]);

    // 4. Create Exercises (Graded)
    console.log("Creating graded exercises...");
    
    // Exercise 1: Tingkat 1 (Pembagian Mudah)
    const ex1Res = await client.query(`
      INSERT INTO exercises (chapter_id, title)
      VALUES ($1, 'Kuis Pembagian Mudah (Tingkat 1)')
      RETURNING id;
    `, [chapterId]);
    const ex1Id = ex1Res.rows[0].id;

    // Exercise 2: Tingkat 2 (Pembagian Menengah)
    const ex2Res = await client.query(`
      INSERT INTO exercises (chapter_id, title)
      VALUES ($1, 'Kuis Pembagian Menengah (Tingkat 2)')
      RETURNING id;
    `, [chapterId]);
    const ex2Id = ex2Res.rows[0].id;

    // Exercise 3: Tingkat 3 (Pembagian Sulit)
    const ex3Res = await client.query(`
      INSERT INTO exercises (chapter_id, title)
      VALUES ($1, 'Kuis Pembagian Sulit (Tingkat 3)')
      RETURNING id;
    `, [chapterId]);
    const ex3Id = ex3Res.rows[0].id;

    // 5. Seed Questions for Exercises
    console.log("Inserting questions for exercise 1 (Easy)...");
    await client.query(`
      INSERT INTO questions (exercise_id, question_text, options, correct_answer)
      VALUES 
      ($1, 'Berapakah hasil pembagian dari 14 / 2?', '["6", "7", "8", "9"]'::jsonb, '7'),
      ($1, 'Berapakah hasil pembagian dari 30 / 5?', '["4", "5", "6", "7"]'::jsonb, '6'),
      ($1, 'Berapakah hasil pembagian dari 80 / 10?', '["6", "8", "10", "12"]'::jsonb, '8'),
      ($1, 'Berapakah hasil pembagian dari 18 / 2?', '["7", "8", "9", "10"]'::jsonb, '9'),
      ($1, 'Berapakah hasil pembagian dari 45 / 5?', '["7", "8", "9", "10"]'::jsonb, '9');
    `, [ex1Id]);

    console.log("Inserting questions for exercise 2 (Medium)...");
    await client.query(`
      INSERT INTO questions (exercise_id, question_text, options, correct_answer)
      VALUES 
      ($1, 'Berapakah hasil pembagian dari 24 / 3?', '["6", "7", "8", "9"]'::jsonb, '8'),
      ($1, 'Berapakah hasil pembagian dari 28 / 4?', '["6", "7", "8", "9"]'::jsonb, '7'),
      ($1, 'Berapakah hasil pembagian dari 63 / 9?', '["5", "6", "7", "8"]'::jsonb, '7'),
      ($1, 'Berapakah hasil pembagian dari 27 / 3?', '["8", "9", "10", "11"]'::jsonb, '9'),
      ($1, 'Berapakah hasil pembagian dari 36 / 4?', '["8", "9", "10", "11"]'::jsonb, '9');
    `, [ex2Id]);

    console.log("Inserting questions for exercise 3 (Hard)...");
    await client.query(`
      INSERT INTO questions (exercise_id, question_text, options, correct_answer)
      VALUES 
      ($1, 'Berapakah hasil pembagian dari 56 / 7?', '["6", "7", "8", "9"]'::jsonb, '8'),
      ($1, 'Berapakah hasil pembagian dari 48 / 6?', '["6", "7", "8", "9"]'::jsonb, '8'),
      ($1, 'Berapakah hasil pembagian dari 49 / 7?', '["6", "7", "8", "9"]'::jsonb, '7'),
      ($1, 'Berapakah hasil pembagian dari 42 / 6?', '["6", "7", "8", "9"]'::jsonb, '7'),
      ($1, 'Berapakah hasil pembagian dari 64 / 8?', '["6", "7", "8", "9"]'::jsonb, '8');
    `, [ex3Id]);

    // 6. Seed Badges for Division
    console.log("Creating gamification badges...");
    await client.query(`
      INSERT INTO badges (name, icon, condition_type, condition_value, subject_id, is_active)
      VALUES 
      ('Ksatria Pembagi', 'Award', 'complete_exercise', '2', $1, true),
      ('Master Pembagian', 'Star', 'perfect_score', '100', $1, true);
    `, [subjectId]);

    console.log("Division quiz and badges seeded successfully!");

  } catch (err) {
    console.error("Error executing db-pembagian script:", err);
  } finally {
    await client.end();
  }
}

run();
