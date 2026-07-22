const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const { scoreCVAgainstJob, isScorerAvailable } = require('./scorer');
const { applicantsData } = require('./generate_dataset');

// Deskripsi Pekerjaan Target (Job Descriptions)
const jobdesks = [
  {
    key: "uiux",
    title: "UI UX Designer",
    subject_keyword: "UI UX",
    department: "Product Design",
    experience_level: "Mid-level",
    description: "Kami mencari UI/UX Designer yang mahir Figma dan Adobe XD. Anda bertanggung jawab melakukan user research, membuat wireframe, prototype interaktif, merancang design system, melakukan usability testing, dan berkolaborasi erat dengan product manager serta tim frontend developer."
  },
  {
    key: "frontend",
    title: "Frontend Developer",
    subject_keyword: "FRONT END",
    department: "Engineering",
    experience_level: "Mid-level",
    description: "Kami mencari Frontend Developer untuk membangun aplikasi web. Tech stack utama kami adalah React, React.js, TypeScript, JavaScript, HTML5, CSS3, Tailwind CSS, Redux, Sass, Webpack, Git, REST API Integration, Responsive Web Design. Tanggung jawab meliputi integrasi REST API, membuat responsive web design, optimasi performa web, dan berkolaborasi menggunakan Git."
  },
  {
    key: "backend",
    title: "Backend Developer",
    subject_keyword: "BACK END",
    department: "Engineering",
    experience_level: "Mid-level",
    description: "Kami mencari Backend Engineer / Developer. Keahlian yang dibutuhkan adalah Node.js, Express, Go, Golang, MySQL, PostgreSQL, Redis, REST API, JWT, Docker, Git. Anda akan merancang database relasional, mengoptimalkan query, menerapkan keamanan server, serta membangun arsitektur microservices."
  },
  {
    key: "fullstack",
    title: "Fullstack Developer",
    subject_keyword: "FULL STACK",
    department: "Engineering",
    experience_level: "Mid-level",
    description: "Kami mencari Fullstack Developer. Tech stack utama kami adalah React, React.js, Node.js, Express, MySQL, PostgreSQL, JavaScript, HTML5, CSS3, Tailwind CSS, TypeScript, REST API, Git, JWT. Anda bertanggung jawab mengembangkan fitur frontend dan backend secara end-to-end."
  }
];

const UPLOADS_DIR = path.join(__dirname, '../uploads');

async function seed() {
  console.log('🏁 Memulai proses seeding database...');

  // 1. Cek Scorer Flask Service
  const scorerOnline = await isScorerAvailable();
  if (!scorerOnline) {
    console.error('❌ ERROR: Python Scorer Service sedang OFFLINE!');
    console.error('   Silakan jalankan service Flask terlebih dahulu dengan perintah:');
    console.error('   python backend/ml/scorer_service.py');
    process.exit(1);
  }
  console.log('✅ TalentSift v2 Python scorer service terdeteksi: ONLINE');

  try {
    // 2. Ambil user pertama sebagai creator
    const [users] = await pool.query('SELECT id FROM users LIMIT 1');
    if (users.length === 0) {
      console.error('❌ ERROR: Tidak ada user di tabel users. Silakan import schema.sql terlebih dahulu.');
      process.exit(1);
    }
    const creatorId = users[0].id;
    console.log(`👤 Menggunakan User ID: ${creatorId} sebagai pembuat Jobdesk`);

    // 3. Masukkan Jobdesks jika belum ada
    const jobKeyToId = {};
    for (const job of jobdesks) {
      const [existing] = await pool.query('SELECT id FROM jobdesks WHERE title = ?', [job.title]);
      
      let jobdeskId;
      if (existing.length > 0) {
        jobdeskId = existing[0].id;
        console.log('📌 Jobdesk "' + job.title + '" sudah ada dengan ID: ' + jobdeskId);
        // Update deskripsi untuk memastikan menggunakan versi terbaru untuk pencocokan TF-IDF
        await pool.query('UPDATE jobdesks SET description = ?, subject_keyword = ?, email_subject = ? WHERE id = ?', 
          [job.description, job.subject_keyword, 'LAMARAN KERJA - ' + job.subject_keyword, jobdeskId]
        );
      } else {
        const [result] = await pool.query(
          `INSERT INTO jobdesks (title, subject_keyword, email_subject, department, experience_level, description, status, created_by)
           VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
          [job.title, job.subject_keyword, 'LAMARAN KERJA - ' + job.subject_keyword, job.department, job.experience_level, job.description, creatorId]
        );
        jobdeskId = result.insertId;
        console.log('🆕 Membuat Jobdesk baru "' + job.title + '" dengan ID: ' + jobdeskId);
      }
      jobKeyToId[job.key] = jobdeskId;
    }

    // 4. Bersihkan data applicants lama agar tidak duplikat untuk pengujian
    console.log('🧹 Membersihkan data pelamar lama di database...');
    await pool.query('DELETE FROM applicants');
    console.log('✨ Data pelamar lama berhasil dibersihkan.');

    // 5. Simpan dan Score 25 CV Pelamar
    console.log('\n📄 Memproses 25 CV dan menghitung AI Score...');
    for (const app of applicantsData) {
      const pdfPath = path.join(UPLOADS_DIR, app.filename);
      
      // Deteksi job key dari nama file untuk pemetaan yang tepat
      let jobKey = "";
      if (app.filename.includes("uiux")) jobKey = "uiux";
      else if (app.filename.includes("frontend")) jobKey = "frontend";
      else if (app.filename.includes("backend")) jobKey = "backend";
      else if (app.filename.includes("fullstack")) jobKey = "fullstack";
      else {
        // Kontrol Non-IT dibagikan rata
        if (app.filename.includes("chef") || app.filename.includes("receptionist")) jobKey = "uiux";
        else if (app.filename.includes("accountant")) jobKey = "frontend";
        else if (app.filename.includes("admin")) jobKey = "backend";
        else if (app.filename.includes("marketing")) jobKey = "fullstack";
      }

      // Gabungkan data teks untuk dikirim ke scorer
      const cvText = `${app.title} ${app.skills} ${app.summary} ${app.experience} ${app.education}`;

      // Dapatkan Jobdesk tujuan
      const jobdeskId = jobKeyToId[jobKey];
      const targetJob = jobdesks.find(j => j.key === jobKey);

      // Hitung skor kecocokan dengan scorer service Flask
      const scoreResult = await scoreCVAgainstJob(cvText, targetJob.description);

      // Simpan ke database
      await pool.query(
        `INSERT INTO applicants 
         (jobdesk_id, name, email, role, cv_filename, cv_path, cv_text, match_score, screening_status, email_status, received_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Integrated', NOW())`,
        [
          jobdeskId,
          app.name,
          app.email,
          'Applicant',
          app.filename,
          pdfPath,
          cvText,
          scoreResult.score,
          scoreResult.label,
        ]
      );

      console.log(`   [${scoreResult.score}% - ${scoreResult.label}] Berhasil menyimpan ${app.name} -> ${targetJob.title}`);
    }

    console.log('\n🎉 PROSES SEEDING DATABASE SELESAI DENGAN SUKSES!');
    console.log('   Semua data CV dummy dan skor kecocokan ideal Anda telah siap.');
    process.exit(0);

  } catch (err) {
    console.error('❌ Terjadi kesalahan saat seeding:', err.message);
    process.exit(1);
  }
}

seed();
