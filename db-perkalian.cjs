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

    // 2. Create Chapter 2: Trik & Hafalan Perkalian 1-10
    console.log("Creating Chapter 2...");
    const chapRes = await client.query(`
      INSERT INTO chapters (subject_id, title, order_number)
      VALUES ($1, 'Trik & Hafalan Perkalian 1-10', 2)
      RETURNING id;
    `, [subjectId]);
    const chapterId = chapRes.rows[0].id;

    // 3. Create Theory for Chapter 2
    console.log("Creating theory content...");
    await client.query(`
      INSERT INTO theories (chapter_id, title, content)
      VALUES ($1, 'Trik Menghafal Perkalian Cepat', 
      'Perkalian sebenarnya adalah penjumlahan yang berulang-ulang. Untuk menghafal perkalian 1 sampai 10 secara cepat dan efisien, gunakan trik-trik berikut:\n\n1. SIFAT KOMUTATIF (Bolak-balik Sama)\nPerkalian bersifat komutatif: A x B = B x A.\nMisalnya, jika kamu sudah hafal 2 x 7 = 14, maka secara otomatis kamu juga tahu bahwa 7 x 2 = 14. Dengan memahami ini, kamu memangkas jumlah hafalan dari 100 kombinasi menjadi hanya 55 kombinasi unik saja!\n\n2. TRIK JARI PERKALIAN 9\nBuka kedua telapak tanganmu di depan wajah. Urutkan jari dari 1 (ibu jari kiri) hingga 10 (ibu jari kanan).\nMisal: 9 x 4. Tekuk jari ke-4 dari kiri (jari manis kiri).\n- Hitung jari di sebelah kiri jari yang ditekuk: ada 3 jari (menunjukkan puluhan: 30).\n- Hitung jari di sebelah kanan jari yang ditekuk: ada 6 jari (menunjukkan satuan: 6).\n- Hasilnya gabungkan menjadi: 36!\n\n3. POLA PERKALIAN 5\nHasil perkalian 5 selalu diakhiri dengan angka 5 (jika dikalikan ganjil) atau angka 0 (jika dikalikan genap). Contoh: 5 x 3 = 15, 5 x 4 = 20, 5 x 5 = 25.');
    `, [chapterId]);

    // 4. Create Exercises (Graded)
    console.log("Creating graded exercises...");
    
    // Exercise 1: Tingkat 1 (Perkalian Mudah)
    const ex1Res = await client.query(`
      INSERT INTO exercises (chapter_id, title)
      VALUES ($1, 'Kuis Perkalian Mudah (Tingkat 1)')
      RETURNING id;
    `, [chapterId]);
    const ex1Id = ex1Res.rows[0].id;

    // Exercise 2: Tingkat 2 (Perkalian Menengah)
    const ex2Res = await client.query(`
      INSERT INTO exercises (chapter_id, title)
      VALUES ($1, 'Kuis Perkalian Menengah (Tingkat 2)')
      RETURNING id;
    `, [chapterId]);
    const ex2Id = ex2Res.rows[0].id;

    // Exercise 3: Tingkat 3 (Perkalian Sulit)
    const ex3Res = await client.query(`
      INSERT INTO exercises (chapter_id, title)
      VALUES ($1, 'Kuis Perkalian Sulit (Tingkat 3)')
      RETURNING id;
    `, [chapterId]);
    const ex3Id = ex3Res.rows[0].id;

    // 5. Seed Questions for Exercises
    console.log("Inserting questions for exercise 1 (Easy)...");
    await client.query(`
      INSERT INTO questions (exercise_id, question_text, options, correct_answer)
      VALUES 
      ($1, 'Berapakah hasil perkalian dari 2 x 7?', '["12", "14", "16", "18"]'::jsonb, '14'),
      ($1, 'Berapakah hasil perkalian dari 5 x 6?', '["25", "30", "35", "40"]'::jsonb, '30'),
      ($1, 'Berapakah hasil perkalian dari 10 x 8?', '["70", "80", "90", "100"]'::jsonb, '80'),
      ($1, 'Berapakah hasil perkalian dari 2 x 9?', '["16", "18", "20", "22"]'::jsonb, '18'),
      ($1, 'Berapakah hasil perkalian dari 5 x 9?', '["40", "45", "50", "55"]'::jsonb, '45');
    `, [ex1Id]);

    console.log("Inserting questions for exercise 2 (Medium)...");
    await client.query(`
      INSERT INTO questions (exercise_id, question_text, options, correct_answer)
      VALUES 
      ($1, 'Berapakah hasil perkalian dari 3 x 8?', '["21", "24", "27", "30"]'::jsonb, '24'),
      ($1, 'Berapakah hasil perkalian dari 4 x 7?', '["24", "28", "32", "36"]'::jsonb, '28'),
      ($1, 'Berapakah hasil perkalian dari 9 x 7?', '["54", "63", "72", "81"]'::jsonb, '63'),
      ($1, 'Berapakah hasil perkalian dari 3 x 9?', '["24", "27", "30", "33"]'::jsonb, '27'),
      ($1, 'Berapakah hasil perkalian dari 4 x 9?', '["32", "36", "40", "44"]'::jsonb, '36');
    `, [ex2Id]);

    console.log("Inserting questions for exercise 3 (Hard)...");
    await client.query(`
      INSERT INTO questions (exercise_id, question_text, options, correct_answer)
      VALUES 
      ($1, 'Berapakah hasil perkalian dari 7 x 8?', '["54", "56", "62", "64"]'::jsonb, '56'),
      ($1, 'Berapakah hasil perkalian dari 6 x 8?', '["42", "48", "54", "56"]'::jsonb, '48'),
      ($1, 'Berapakah hasil perkalian dari 7 x 7?', '["42", "47", "49", "54"]'::jsonb, '49'),
      ($1, 'Berapakah hasil perkalian dari 6 x 7?', '["36", "42", "48", "54"]'::jsonb, '42'),
      ($1, 'Berapakah hasil perkalian dari 8 x 8?', '["56", "64", "72", "80"]'::jsonb, '64');
    `, [ex3Id]);

    // 6. Seed Badges for Multiplication
    console.log("Creating gamification badges...");
    await client.query(`
      INSERT INTO badges (name, icon, condition_type, condition_value, subject_id, is_active)
      VALUES 
      ('Ksatria Angka', 'Award', 'complete_exercise', '2', $1, true),
      ('Master Perkalian', 'Star', 'perfect_score', '100', $1, true);
    `, [subjectId]);

    console.log("Multiplication quiz and badges seeded successfully!");

  } catch (err) {
    console.error("Error executing db-perkalian script:", err);
  } finally {
    await client.end();
  }
}

run();
