import pg from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
const DB_URL_FALLBACK = 'postgresql://neondb_owner:npg_MN89fGchBILz@ep-crimson-river-atoix06e-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-s3-sentinel-key-2026';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Helper to establish DB connection
async function getDbClient() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || DB_URL_FALLBACK,
    ssl: {
      rejectUnauthorized: false,
    },
  });
  await client.connect();
  return client;
}

// Helper to verify JWT token and return user info
function authenticate(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing or invalid token format');
  }
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    throw new Error('Unauthorized: Invalid or expired token');
  }
}

export const handler = async (event, context) => {
  // Handle Preflight OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  // Parse path
  // Since redirects are from /api/* to /.netlify/functions/api/:splat
  // path will be /api/auth/login, etc.
  const path = event.path.replace(/^\/\.netlify\/functions\/api/, '/api');
  const method = event.httpMethod;

  if (path === '/api/debug' && method === 'GET') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 25) : null,
        nodeEnv: process.env.NODE_ENV,
        envKeys: Object.keys(process.env).filter(k => k.includes('DATA') || k.includes('JWT') || k.includes('NETLIFY'))
      }),
    };
  }

  let client;
  try {
    client = await getDbClient();

    // ==========================================
    // 1. AUTHENTICATION ENDPOINTS
    // ==========================================
    if (path === '/api/auth/register' && method === 'POST') {
      const { name, email, password, role } = JSON.parse(event.body);
      if (!name || !email || !password) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Name, email, and password are required' }),
        };
      }
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      
      const userRole = role === 'admin' ? 'admin' : 'murid';

      const res = await client.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
        [name, email, passwordHash, userRole]
      );
      
      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify(res.rows[0]),
      };
    }

    if (path === '/api/auth/login' && method === 'POST') {
      const { email, password } = JSON.parse(event.body);
      if (!email || !password) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Email and password are required' }),
        };
      }

      const res = await client.query('SELECT * FROM users WHERE email = $1', [email]);
      if (res.rows.length === 0) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'User not found' }),
        };
      }

      const user = res.rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Incorrect password' }),
        };
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: '1d' }
      );

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          token,
          user: { id: user.id, name: user.name, email: user.email, role: user.role },
        }),
      };
    }

    // ==========================================
    // SECURED ENDPOINTS (Require Authorization)
    // ==========================================
    const user = authenticate(event);

    // ==========================================
    // 2. SUBJECTS ENDPOINTS
    // ==========================================
    if (path === '/api/subjects') {
      if (method === 'GET') {
        // Murid only sees active subjects, admin sees all
        const query = user.role === 'admin' 
          ? 'SELECT * FROM subjects ORDER BY id ASC'
          : 'SELECT * FROM subjects WHERE is_active = true ORDER BY id ASC';
        const res = await client.query(query);
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(res.rows),
        };
      }

      if (method === 'POST') {
        if (user.role !== 'admin') throw new Error('Forbidden');
        const { name, description, icon, is_active } = JSON.parse(event.body);
        const res = await client.query(
          'INSERT INTO subjects (name, description, icon, is_active) VALUES ($1, $2, $3, $4) RETURNING *',
          [name, description, icon, is_active !== false]
        );
        return {
          statusCode: 201,
          headers: corsHeaders,
          body: JSON.stringify(res.rows[0]),
        };
      }
    }

    // Subject CRUD detail
    if (path.startsWith('/api/subjects/') && user.role === 'admin') {
      const id = path.split('/').pop();
      if (method === 'PUT') {
        const { name, description, icon, is_active } = JSON.parse(event.body);
        const res = await client.query(
          'UPDATE subjects SET name = $1, description = $2, icon = $3, is_active = $4 WHERE id = $5 RETURNING *',
          [name, description, icon, is_active, id]
        );
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(res.rows[0]),
        };
      }
      if (method === 'DELETE') {
        await client.query('DELETE FROM subjects WHERE id = $1', [id]);
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ success: true }),
        };
      }
    }

    // ==========================================
    // 3. CHAPTERS ENDPOINTS
    // ==========================================
    if (path === '/api/chapters') {
      if (method === 'GET') {
        const subject_id = event.queryStringParameters.subject_id;
        const res = await client.query(
          'SELECT * FROM chapters WHERE subject_id = $1 ORDER BY order_number ASC',
          [subject_id]
        );
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(res.rows),
        };
      }

      if (method === 'POST') {
        if (user.role !== 'admin') throw new Error('Forbidden');
        const { subject_id, title, order_number } = JSON.parse(event.body);
        const res = await client.query(
          'INSERT INTO chapters (subject_id, title, order_number) VALUES ($1, $2, $3) RETURNING *',
          [subject_id, title, order_number]
        );
        return {
          statusCode: 201,
          headers: corsHeaders,
          body: JSON.stringify(res.rows[0]),
        };
      }
    }

    if (path.startsWith('/api/chapters/') && user.role === 'admin') {
      const id = path.split('/').pop();
      if (method === 'PUT') {
        const { title, order_number } = JSON.parse(event.body);
        const res = await client.query(
          'UPDATE chapters SET title = $1, order_number = $2 WHERE id = $3 RETURNING *',
          [title, order_number, id]
        );
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(res.rows[0]),
        };
      }
      if (method === 'DELETE') {
        await client.query('DELETE FROM chapters WHERE id = $1', [id]);
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ success: true }),
        };
      }
    }

    // ==========================================
    // 4. THEORIES ENDPOINTS
    // ==========================================
    if (path === '/api/theories') {
      if (method === 'GET') {
        const chapter_id = event.queryStringParameters.chapter_id;
        const res = await client.query(
          'SELECT * FROM theories WHERE chapter_id = $1 ORDER BY id ASC',
          [chapter_id]
        );
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(res.rows),
        };
      }

      if (method === 'POST') {
        if (user.role !== 'admin') throw new Error('Forbidden');
        const { chapter_id, title, content } = JSON.parse(event.body);
        // Insert or Update (upsert)
        const check = await client.query('SELECT * FROM theories WHERE chapter_id = $1', [chapter_id]);
        let res;
        if (check.rows.length > 0) {
          res = await client.query(
            'UPDATE theories SET title = $1, content = $2 WHERE chapter_id = $3 RETURNING *',
            [title, content, chapter_id]
          );
        } else {
          res = await client.query(
            'INSERT INTO theories (chapter_id, title, content) VALUES ($1, $2, $3) RETURNING *',
            [chapter_id, title, content]
          );
        }
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(res.rows[0]),
        };
      }
    }

    // ==========================================
    // 5. EXERCISES ENDPOINTS
    // ==========================================
    if (path === '/api/exercises') {
      if (method === 'GET') {
        const chapter_id = event.queryStringParameters.chapter_id;
        const res = await client.query(
          'SELECT * FROM exercises WHERE chapter_id = $1 ORDER BY id ASC',
          [chapter_id]
        );
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(res.rows),
        };
      }

      if (method === 'POST') {
        if (user.role !== 'admin') throw new Error('Forbidden');
        const { chapter_id, title } = JSON.parse(event.body);
        const res = await client.query(
          'INSERT INTO exercises (chapter_id, title) VALUES ($1, $2) RETURNING *',
          [chapter_id, title]
        );
        return {
          statusCode: 201,
          headers: corsHeaders,
          body: JSON.stringify(res.rows[0]),
        };
      }
    }

    // ==========================================
    // 6. QUESTIONS ENDPOINTS
    // ==========================================
    if (path === '/api/questions') {
      if (method === 'GET') {
        const exercise_id = event.queryStringParameters.exercise_id;
        const res = await client.query(
          'SELECT * FROM questions WHERE exercise_id = $1 ORDER BY id ASC',
          [exercise_id]
        );
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(res.rows),
        };
      }

      if (method === 'POST') {
        if (user.role !== 'admin') throw new Error('Forbidden');
        const { exercise_id, question_text, options, correct_answer } = JSON.parse(event.body);
        const res = await client.query(
          'INSERT INTO questions (exercise_id, question_text, options, correct_answer) VALUES ($1, $2, $3, $4) RETURNING *',
          [exercise_id, question_text, JSON.stringify(options), correct_answer]
        );
        return {
          statusCode: 201,
          headers: corsHeaders,
          body: JSON.stringify(res.rows[0]),
        };
      }
    }

    if (path.startsWith('/api/questions/') && user.role === 'admin') {
      const id = path.split('/').pop();
      if (method === 'PUT') {
        const { question_text, options, correct_answer } = JSON.parse(event.body);
        const res = await client.query(
          'UPDATE questions SET question_text = $1, options = $2, correct_answer = $3 WHERE id = $4 RETURNING *',
          [question_text, JSON.stringify(options), correct_answer, id]
        );
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(res.rows[0]),
        };
      }
      if (method === 'DELETE') {
        await client.query('DELETE FROM questions WHERE id = $1', [id]);
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ success: true }),
        };
      }
    }

    // ==========================================
    // 7. STUDENT RESULTS & SUBMISSIONS
    // ==========================================
    if (path === '/api/results') {
      if (method === 'POST') {
        // Submit answers
        const { exercise_id, answers } = JSON.parse(event.body); // answers is object { questionId: answerText }
        
        // Fetch all questions for this exercise
        const questionsRes = await client.query('SELECT * FROM questions WHERE exercise_id = $1', [exercise_id]);
        const questions = questionsRes.rows;
        
        let correctCount = 0;
        questions.forEach(q => {
          if (answers[q.id] === q.correct_answer) {
            correctCount++;
          }
        });
        
        const total = questions.length;
        const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;
        
        const insertRes = await client.query(
          'INSERT INTO student_results (user_id, exercise_id, score, answers, started_at, completed_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *',
          [user.id, exercise_id, score, JSON.stringify(answers)]
        );
        
        // Gamification / Badges Trigger Evaluation
        // Get chapter and subject for this exercise
        const infoRes = await client.query(`
          SELECT c.subject_id FROM exercises e
          JOIN chapters c ON e.chapter_id = c.id
          WHERE e.id = $1
        `, [exercise_id]);
        const subjectId = infoRes.rows[0]?.subject_id;
        
        const earnedBadges = [];
        if (subjectId) {
          // Check for any matching badges for this subject
          const badgesRes = await client.query(
            'SELECT * FROM badges WHERE subject_id = $1 AND is_active = true', 
            [subjectId]
          );
          
          for (const badge of badgesRes.rows) {
            let qualify = false;
            
            // Check if murid already has this badge
            const hasBadge = await client.query(
              'SELECT 1 FROM student_badges WHERE user_id = $1 AND badge_id = $2',
              [user.id, badge.id]
            );
            
            if (hasBadge.rows.length === 0) {
              if (badge.condition_type === 'perfect_score' && score === 100) {
                qualify = true;
              } else if (badge.condition_type === 'complete_exercise') {
                // Check if they completed at least 1 exercise
                qualify = true; 
              }
              
              if (qualify) {
                await client.query(
                  'INSERT INTO student_badges (user_id, badge_id) VALUES ($1, $2)',
                  [user.id, badge.id]
                );
                earnedBadges.push(badge);
              }
            }
          }
        }
        
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            result: insertRes.rows[0],
            score,
            correctCount,
            total,
            earnedBadges
          }),
        };
      }

      if (method === 'GET') {
        let query;
        let params = [];
        if (user.role === 'admin') {
          // Admin can see everything
          query = `
            SELECT r.*, u.name as student_name, e.title as exercise_title, s.name as subject_name 
            FROM student_results r
            JOIN users u ON r.user_id = u.id
            JOIN exercises e ON r.exercise_id = e.id
            JOIN chapters c ON e.chapter_id = c.id
            JOIN subjects s ON c.subject_id = s.id
            ORDER BY r.completed_at DESC
          `;
        } else {
          // Murid sees only their own results
          query = `
            SELECT r.*, e.title as exercise_title, s.name as subject_name 
            FROM student_results r
            JOIN exercises e ON r.exercise_id = e.id
            JOIN chapters c ON e.chapter_id = c.id
            JOIN subjects s ON c.subject_id = s.id
            WHERE r.user_id = $1
            ORDER BY r.completed_at DESC
          `;
          params = [user.id];
        }
        
        const res = await client.query(query, params);
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(res.rows),
        };
      }
    }

    // ==========================================
    // 8. GAMIFICATION & BADGES
    // ==========================================
    if (path === '/api/badges' && method === 'GET') {
      const res = await client.query(`
        SELECT sb.*, b.name, b.icon, b.condition_type, b.condition_value, s.name as subject_name
        FROM student_badges sb
        JOIN badges b ON sb.badge_id = b.id
        JOIN subjects s ON b.subject_id = s.id
        WHERE sb.user_id = $1
        ORDER BY sb.earned_at DESC
      `, [user.id]);
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(res.rows),
      };
    }

    if (path === '/api/admin/badges') {
      if (user.role !== 'admin') throw new Error('Forbidden');
      if (method === 'GET') {
        const res = await client.query(`
          SELECT b.*, s.name as subject_name
          FROM badges b
          JOIN subjects s ON b.subject_id = s.id
          ORDER BY b.id ASC
        `);
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(res.rows),
        };
      }
      
      if (method === 'POST') {
        const { name, icon, condition_type, condition_value, subject_id, is_active } = JSON.parse(event.body);
        const res = await client.query(
          'INSERT INTO badges (name, icon, condition_type, condition_value, subject_id, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [name, icon, condition_type, condition_value, subject_id, is_active !== false]
        );
        return {
          statusCode: 201,
          headers: corsHeaders,
          body: JSON.stringify(res.rows[0]),
        };
      }
    }

    if (path.startsWith('/api/admin/badges/') && user.role === 'admin') {
      const id = path.split('/').pop();
      if (method === 'PUT') {
        const { name, icon, condition_type, condition_value, is_active } = JSON.parse(event.body);
        const res = await client.query(
          'UPDATE badges SET name = $1, icon = $2, condition_type = $3, condition_value = $4, is_active = $5 WHERE id = $6 RETURNING *',
          [name, icon, condition_type, condition_value, is_active, id]
        );
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(res.rows[0]),
        };
      }
      if (method === 'DELETE') {
        await client.query('DELETE FROM badges WHERE id = $1', [id]);
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ success: true }),
        };
      }
    }

    // ==========================================
    // 9. ADMIN METRICS / STATS
    // ==========================================
    if (path === '/api/admin/stats' && method === 'GET') {
      if (user.role !== 'admin') throw new Error('Forbidden');
      
      const totalStudentsRes = await client.query("SELECT COUNT(*) FROM users WHERE role = 'murid'");
      const totalSubjectsRes = await client.query("SELECT COUNT(*) FROM subjects");
      const totalResultsRes = await client.query("SELECT COUNT(*) FROM student_results");
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          totalStudents: parseInt(totalStudentsRes.rows[0].count, 10),
          totalSubjects: parseInt(totalSubjectsRes.rows[0].count, 10),
          totalExercisesCompleted: parseInt(totalResultsRes.rows[0].count, 10),
        }),
      };
    }

    // Default 404
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Endpoint not found' }),
    };

  } catch (err) {
    console.error('Error handling API request:', err);
    return {
      statusCode: err.message.startsWith('Unauthorized') ? 401 : err.message.startsWith('Forbidden') ? 403 : 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message || 'Internal Server Error' }),
    };
  } finally {
    if (client) {
      await client.end();
    }
  }
};
