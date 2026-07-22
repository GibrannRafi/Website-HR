const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Pastikan folder uploads tersedia
const UPLOADS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Data 25 CV Pelamar dummy dengan skill & kualifikasi yang terkalibrasi
const applicantsData = [
  // UI/UX DESIGNER
  {
    filename: "cv_1_uiux_high.pdf",
    name: "Aris Setiawan",
    email: "aris.setiawan@example.com",
    title: "Senior UI/UX Designer",
    skills: "Figma, Adobe XD, Sketch, Wireframing, Prototyping, Usability Testing, User Research, Design Systems, Design Thinking, Handoff, Marvel, InVision, HTML/CSS (Basic)",
    summary: "Desainer UI/UX dengan pengalaman lebih dari 4 tahun dalam merancang antarmuka pengguna untuk aplikasi mobile dan web. Sangat mahir menggunakan Figma dan Adobe XD. Berorientasi pada kenyamanan pengguna dan berkolaborasi erat dengan tim developer.",
    experience: "Lead UI/UX Designer di TechSolindo (2022 - Sekarang): Merancang design system untuk 3 aplikasi utama perusahaan, meningkatkan retensi pengguna sebesar 25%. UI/UX Designer di CreativeStudio (2020 - 2022): Membuat wireframe, prototype interaktif, dan memimpin sesi usability testing.",
    education: "S1 Desain Komunikasi Visual (DKV), Universitas Indonesia (2016 - 2020)"
  },
  {
    filename: "cv_2_uiux_medium.pdf",
    name: "Bima Pratama",
    email: "bima.pratama@example.com",
    title: "UI/UX Designer",
    skills: "Figma, Adobe Photoshop, Adobe Illustrator, Wireframing, Prototyping, Graphic Design, Web Design",
    summary: "Desainer grafis yang beralih ke bidang UI/UX. Memiliki pemahaman kuat tentang elemen visual, layout, dan tipografi. Berpengalaman 2 tahun merancang landing page dan aplikasi web sederhana menggunakan Figma.",
    experience: "UI/UX Designer di StartupLokal (2023 - Sekarang): Merancang halaman website pemasaran dan dashboard internal. Graphic Designer di MediaKreatif (2021 - 2023): Membuat aset grafis promosi media sosial.",
    education: "S1 Sistem Informasi, Universitas Bina Nusantara (2017 - 2021)"
  },
  {
    filename: "cv_3_uiux_low.pdf",
    name: "Citra Lestari",
    email: "citra.lestari@example.com",
    title: "Junior Graphic Designer",
    skills: "Adobe Photoshop, Adobe Illustrator, CorelDRAW, Graphic Design, Microsoft Office, Canva",
    summary: "Lulusan baru DKV yang berfokus pada desain grafis, ilustrasi, dan branding. Tertarik untuk mempelajari UI/UX secara otodidak namun belum memiliki portofolio produk digital yang komprehensif.",
    experience: "Magang Desainer Grafis di Percetakan Jaya (2023): Mendesain banner, brosur, kartu nama, dan spanduk promosi.",
    education: "D3 Desain Komunikasi Visual, Politeknik Negeri Jakarta (2020 - 2023)"
  },
  {
    filename: "cv_4_uiux_med2.pdf",
    name: "Dimas Nugraha",
    email: "dimas.nugraha@example.com",
    title: "Product Designer (UI/UX)",
    skills: "Figma, Sketch, Wireframing, User Journey, Prototyping, Usability Testing, Adobe XD, Interaction Design",
    summary: "Desainer produk interaktif dengan fokus pada pengalaman pengguna digital. Berpengalaman menerjemahkan kebutuhan bisnis menjadi interface produk yang ramah pengguna.",
    experience: "UI/UX Designer di E-CommerceHub (2022 - Sekarang): Berkolaborasi dengan product manager untuk mengoptimalkan alur checkout belanja online.",
    education: "S1 Informatika, UPN Veteran Jakarta (2018 - 2022)"
  },
  {
    filename: "cv_5_uiux_low2.pdf",
    name: "Elsa Safitri",
    email: "elsa.safitri@example.com",
    title: "Front End Developer & Design Hobbyist",
    skills: "HTML5, CSS3, JavaScript, Bootstrap, basic Figma, Web Design",
    summary: "Junior Frontend developer dengan ketertarikan sampingan pada desain web. Lebih banyak menulis kode UI dibanding merancang riset pengguna atau membuat wireframe terstruktur.",
    experience: "Web Developer di WebAgensi (2023 - Sekarang): Mengubah desain Figma statis menjadi halaman HTML/CSS interaktif.",
    education: "S1 Informatika, Gunadarma (2019 - 2023)"
  },

  // FRONTEND DEVELOPER
  {
    filename: "cv_6_frontend_high.pdf",
    name: "Farhan Hidayat",
    email: "farhan.hidayat@example.com",
    title: "Senior Frontend Developer",
    skills: "React, React.js, TypeScript, JavaScript, HTML5, CSS3, Tailwind CSS, Redux, Sass, Webpack, Git, REST API Integration, Responsive Web Design",
    summary: "Frontend Engineer berpengalaman 4+ tahun dalam membangun aplikasi web SPA berkinerja tinggi menggunakan React.js dan TypeScript. Sangat peduli dengan optimasi performa web, SEO, dan aksesibilitas.",
    experience: "Senior Frontend Developer di FinTechIndo (2022 - Sekarang): Memimpin migrasi dashboard ke React + TypeScript, meningkatkan load speed sebesar 40%. Frontend Developer di IndoWeb (2020 - 2022): Mengembangkan component library reusable dengan Tailwind CSS.",
    education: "S1 Teknik Informatika, Institut Teknologi Bandung (2016 - 2020)"
  },
  {
    filename: "cv_7_frontend_medium.pdf",
    name: "Gita Larasati",
    email: "gita.larasati@example.com",
    title: "Frontend Web Developer",
    skills: "JavaScript, Vue, Vue.js, HTML, CSS, Bootstrap, jQuery, Git, REST API, Web Design",
    summary: "Frontend developer dengan pengalaman 2 tahun mengembangkan web menggunakan Vue.js dan JavaScript. Terbiasa mengintegrasikan API eksternal dan menjaga kecocokan tampilan di berbagai layar perangkat.",
    experience: "Junior Frontend Developer di RetailCorp (2023 - Sekarang): Memelihara dan menambahkan modul baru di web toko online menggunakan Vue.js.",
    education: "S1 Ilmu Komputer, Universitas Gadjah Mada (2019 - 2023)"
  },
  {
    filename: "cv_8_frontend_low.pdf",
    name: "Hendra Wijaya",
    email: "hendra.wijaya@example.com",
    title: "Junior Developer & PHP Programmer",
    skills: "PHP, MySQL, HTML, CSS, basic JavaScript, Bootstrap, Laravel",
    summary: "Programmer web yang lebih banyak berfokus pada pemrograman server-side menggunakan PHP Laravel. Memiliki kemampuan dasar HTML/CSS, namun kurang menguasai framework modern modern frontend seperti React atau Vue.",
    experience: "Web Programmer di AgensiDigital (2023): Membuat website profil sekolah dan sistem inventaris sederhana berbasis Laravel.",
    education: "S1 Sistem Informasi, Universitas Diponegoro (2019 - 2023)"
  },
  {
    filename: "cv_9_frontend_med2.pdf",
    name: "Indra Kusuma",
    email: "indra.kusuma@example.com",
    title: "React Developer",
    skills: "React, React.js, JavaScript (ES6+), HTML5, CSS3, Redux, REST API, Tailwind CSS, Git",
    summary: "Pengembang frontend React.js yang antusias dalam menulis kode bersih dan reusable. Terbiasa bekerja dengan tim agile dan mengintegrasikan RESTful API backend ke komponen web.",
    experience: "React Developer di SolusiDigital (2022 - Sekarang): Membangun modul manajemen data dan laporan transaksi klien menggunakan React.",
    education: "S1 Sistem Informasi, Universitas Brawijaya (2018 - 2022)"
  },
  {
    filename: "cv_10_frontend_low2.pdf",
    name: "Joko Susilo",
    email: "joko.susilo@example.com",
    title: "UI/UX Designer & HTML coder",
    skills: "Figma, Adobe Photoshop, HTML, CSS, WordPress, basic JavaScript",
    summary: "Desainer UI/UX yang dapat melakukan slicing layout HTML/CSS dasar. Memilih karir desain visual namun ingin mencoba melamar posisi frontend.",
    experience: "UI/UX Designer & Web Slicer di StudioWeb (2022 - 2024): Mendesain landing page dan menulis kode HTML/CSS statis.",
    education: "S1 Desain Grafis, Universitas Sebelas Maret (2017 - 2021)"
  },

  // BACKEND DEVELOPER
  {
    filename: "cv_11_backend_high.pdf",
    name: "Kurniawan Adi",
    email: "kurniawan.adi@example.com",
    title: "Senior Backend Engineer",
    skills: "Node.js, Express, Go, Golang, MySQL, PostgreSQL, Redis, REST API, JWT, Docker, Git, Microservices, MongoDB, Database Optimization, Server Security",
    summary: "Backend Engineer berpengalaman lebih dari 4 tahun dalam merancang dan mengembangkan API RESTful berskala besar menggunakan Node.js dan Golang. Mahir mengoptimalkan database relasional (MySQL/PostgreSQL) dan caching menggunakan Redis.",
    experience: "Backend Developer Lead di PayIndo (2022 - Sekarang): Merancang arsitektur microservices menggunakan Go dan Node.js, menangani 500k request per hari. Backend Engineer di ServerSolusi (2020 - 2022): Memelihara database MySQL dan mengoptimalkan query yang lambat.",
    education: "S1 Teknik Informatika, Universitas Gadjah Mada (2016 - 2020)"
  },
  {
    filename: "cv_12_backend_medium.pdf",
    name: "Luthfi Hakim",
    email: "luthfi.hakim@example.com",
    title: "NodeJS Developer",
    skills: "Node.js, Express, MySQL, MongoDB, REST API, JavaScript, Git, Postman",
    summary: "Backend developer berfokus pada Node.js Express selama 2 tahun. Terbiasa membuat REST API, autentikasi pengguna dengan JWT, dan mengelola database MySQL.",
    experience: "Node.js Developer di AppKreatif (2023 - Sekarang): Membangun backend service untuk aplikasi reservasi online.",
    education: "S1 Sistem Informasi, Telkom University (2019 - 2023)"
  },
  {
    filename: "cv_13_backend_low.pdf",
    name: "Mega Utami",
    email: "mega.utami@example.com",
    title: "Frontend UI Developer",
    skills: "HTML5, CSS3, JavaScript, React.js, Figma, Tailwind CSS, Git",
    summary: "Frontend developer yang ingin bertransisi ke sisi server. Memiliki pengalaman dasar dalam scripting Javascript namun minim pengalaman dalam merancang arsitektur server, relational database, security, ataupun API backend.",
    experience: "Frontend Web Builder di StudioVisual (2023 - Sekarang): Memperbarui antarmuka aplikasi klien menggunakan React.",
    education: "S1 Teknik Informatika, Universitas Diponegoro (2019 - 2023)"
  },
  {
    filename: "cv_14_backend_med2.pdf",
    name: "Naufal Zaki",
    email: "naufal.zaki@example.com",
    title: "Backend Programmer (PHP & Node)",
    skills: "Node.js, Express, PHP, Laravel, MySQL, REST API, Git, Postman, JWT",
    summary: "Backend Programmer dengan pengalaman 2 tahun mengembangkan web application. Mahir menggunakan framework Laravel PHP dan mulai aktif bermigrasi menggunakan Node.js Express.",
    experience: "Backend Developer di CloudSystem (2022 - Sekarang): Menangani integrasi API pihak ketiga dan manajemen database MySQL.",
    education: "S1 Ilmu Komputer, Universitas Padjadjaran (2018 - 2022)"
  },
  {
    filename: "cv_15_backend_low2.pdf",
    name: "Olivia Putri",
    email: "olivia.putri@example.com",
    title: "IT Support & Database Administrator",
    skills: "Database Administration, SQL Server, MySQL, Windows Server, Networking, Troubleshooting",
    summary: "Profesional IT Support yang terbiasa melakukan troubleshooting hardware, administrasi database SQL Server dasar, dan pengelolaan jaringan kantor. Kurang menguasai koding server development seperti Node.js atau Python.",
    experience: "IT Support di SuksesAbadi (2021 - Sekarang): Mengelola workstation karyawan dan melakukan backup database MySQL harian.",
    education: "D3 Manajemen Informatika, Politeknik Negeri Bandung (2018 - 2021)"
  },

  // FULLSTACK DEVELOPER
  {
    filename: "cv_16_fullstack_high.pdf",
    name: "Putra Pratama",
    email: "putra.pratama@example.com",
    title: "Senior Fullstack Developer",
    skills: "React, React.js, Node.js, Express, MySQL, PostgreSQL, JavaScript, HTML5, CSS3, Tailwind CSS, TypeScript, REST API, Git, JWT, Docker, Redis",
    summary: "Senior Fullstack Engineer berpengalaman 4+ tahun dalam membangun aplikasi web end-to-end. Memiliki pemahaman mendalam tentang komponen visual di sisi frontend (React.js, Tailwind CSS) dan optimasi server di sisi backend (Node.js, Express, database relasional).",
    experience: "Fullstack Lead di GlobalCore (2022 - Sekarang): Mengembangkan aplikasi web e-commerce berskala nasional dari nol menggunakan MERN stack. Software Engineer di MultiTech (2020 - 2022): Berkontribusi pada pengembangan frontend React dan REST API backend Node.js.",
    education: "S1 Teknik Informatika, Universitas Indonesia (2016 - 2020)"
  },
  {
    filename: "cv_17_fullstack_medium.pdf",
    name: "Rian Hidayat",
    email: "rian.hidayat@example.com",
    title: "Full Stack Developer",
    skills: "PHP, Laravel, MySQL, JavaScript, HTML, CSS, Bootstrap, jQuery, Git, REST API",
    summary: "Fullstack developer dengan pengalaman 3 tahun menggunakan PHP Laravel dan JavaScript dasar. Terbiasa membangun aplikasi web monolitis terintegrasi database relasional dan antarmuka web responsif.",
    experience: "Full Stack Programmer di SolusiBisnis (2021 - Sekarang): Membunyikan sistem ERP internal perusahaan dan modul inventaris gudang berbasis Laravel.",
    education: "S1 Sistem Informasi, Universitas Hasanuddin (2018 - 2022)"
  },
  {
    filename: "cv_18_fullstack_low.pdf",
    name: "Sari Dewi",
    email: "sari.dewi@example.com",
    title: "WordPress Developer & Blogger",
    skills: "WordPress, HTML, CSS, PHP, SEO, Canva, Microsoft Office",
    summary: "Pengembang situs web berbasis WordPress dan pembuat konten blog. Mahir melakukan instalasi plugin, kustomisasi tema sederhana dengan CSS, dan mengoptimalkan konten untuk mesin pencari (SEO). Tidak memiliki pengalaman membuat web dari nol dengan JS Framework.",
    experience: "Freelance Web Builder (2022 - Sekarang): Membuat website profil usaha mikro (UMKM) menggunakan CMS WordPress.",
    education: "S1 Sastra Inggris, Universitas Negeri Jakarta (2017 - 2021)"
  },
  {
    filename: "cv_19_fullstack_med2.pdf",
    name: "Tio Nugroho",
    email: "tio.nugroho@example.com",
    title: "Fullstack Web Developer",
    skills: "React, React.js, Node.js, Express, MySQL, JavaScript, Tailwind CSS, REST API, Git",
    summary: "Fullstack Developer muda yang antusias dengan MERN stack. Memiliki pengalaman 2 tahun membangun beberapa aplikasi web fungsional menggunakan React untuk frontend dan Express NodeJS untuk backend API.",
    experience: "Fullstack Developer di StartupInovasi (2023 - Sekarang): Memelihara platform web portal berita dan manajemen konten admin.",
    education: "S1 Informatika, Gunadarma University (2019 - 2023)"
  },
  {
    filename: "cv_20_fullstack_low2.pdf",
    name: "Utami Ningsih",
    email: "utami.ningsih@example.com",
    title: "QA Manual Tester",
    skills: "Software Testing, QA, Bug Tracking, Jira, Manual Testing, Trello, SQL (Basic)",
    summary: "QA Tester berpengalaman melakukan pengujian manual terhadap aplikasi mobile dan web. Memiliki pemahaman mendasar tentang siklus hidup software, namun tidak memiliki keahlian menulis kode untuk backend maupun frontend development.",
    experience: "QA Engineer di SolusiApps (2022 - Sekarang): Menulis skenario uji coba, mendeteksi bug, dan berkoordinasi dengan tim developer.",
    education: "S1 Ilmu Komputer, Universitas Amikom Yogyakarta (2018 - 2022)"
  },

  // NON-IT CONTROL GROUP
  {
    filename: "cv_21_nonit_chef.pdf",
    name: "Vicky Prasetyo",
    email: "vicky.pras@example.com",
    title: "Executive Chef / Koki Kepala",
    skills: "Culinary Arts, Kitchen Management, Menu Development, Food Safety, Cost Control, Recipe Development, Pastry, Western Cuisine, Indonesian Cuisine",
    summary: "Koki profesional dengan 6 tahun pengalaman di restoran bintang lima dan perhotelan. Ahli dalam merancang menu unik, mengelola staf dapur, memastikan keamanan pangan (HACCP), dan meminimalkan biaya bahan makanan.",
    experience: "Executive Chef di RestoMewah Jakarta (2022 - Sekarang): Mengelola operasional dapur utama dan 12 staf koki. Sous Chef di GrandHotel Bali (2019 - 2022): Membantu koki kepala dalam menyiapkan hidangan internasional dan pengadaan bahan baku.",
    education: "D3 Perhotelan & Tataboga, Akademi Pariwisata Trisakti (2015 - 2018)"
  },
  {
    filename: "cv_22_nonit_accountant.pdf",
    name: "Wati Sukmawati",
    email: "wati.sukma@example.com",
    title: "Senior Accountant / Akuntan Keuangan",
    skills: "Financial Reporting, Tax Preparation, Auditing, General Ledger, QuickBooks, Accurate System, Microsoft Excel (Advanced), Financial Analysis, Bookkeeping",
    summary: "Akuntan Keuangan terorganisir dengan pengalaman 5 tahun dalam menangani pembukuan, rekonsiliasi bank, perpajakan, dan pelaporan keuangan tahunan perusahaan retail menengah.",
    experience: "Senior Accountant di PrimaRetailindo (2021 - Sekarang): Menyusun laporan laba rugi bulanan dan laporan pajak PPh 21/23. Akuntan Staf di Kantor Akuntan Publik (KAP) (2019 - 2021): Melakukan audit keuangan eksternal klien.",
    education: "S1 Akuntansi, Universitas Padjadjaran (2014 - 2018)"
  },
  {
    filename: "cv_23_nonit_admin.pdf",
    name: "Xavier Chandra",
    email: "xavier.chandra@example.com",
    title: "Admin Gudang & Logistik",
    skills: "Warehouse Management, Inventory Control, Shipping, Receiving, Stock Opname, Forklift Operation, Supply Chain, Logistics Documentation",
    summary: "Staf administrasi gudang yang teliti dengan keahlian mencatat arus keluar-masuk barang, mengelola stok inventaris, serta melakukan koordinasi dengan kurir ekspedisi pengiriman.",
    experience: "Admin Logistik di GudangDistribusi (2022 - Sekarang): Bertanggung jawab atas kecocokan fisik barang dengan sistem gudang ERP dasar. Staff Gudang di SentraLogistik (2020 - 2022): Mengatur penempatan barang di rak gudang.",
    education: "SMA Negeri 2 Bandung (Lulus 2019)"
  },
  {
    filename: "cv_24_nonit_marketing.pdf",
    name: "Yosef Sitorus",
    email: "yosef.sitorus@example.com",
    title: "Digital Marketing Specialist",
    skills: "Social Media Marketing, SEO, SEM, Google Ads, Meta Ads, Content Strategy, Copywriting, Google Analytics, Email Marketing, Brand Strategy",
    summary: "Spesialis pemasaran digital berorientasi pada peningkatan penjualan dan visibilitas brand secara online. Berpengalaman 3 tahun merancang kampanye iklan berbayar di media sosial dan Google.",
    experience: "Digital Marketer di AgensiIklan (2022 - Sekarang): Mengelola budget iklan Meta Ads klien hingga 50 juta rupiah per bulan, menaikkan omzet penjualan rata-rata 35%. Marketing Staff di EduTech (2021 - 2022): Membuat strategi konten media sosial.",
    education: "S1 Ilmu Komunikasi, Universitas Indonesia (2017 - 2021)"
  },
  {
    filename: "cv_25_nonit_receptionist.pdf",
    name: "Zaskia Nur",
    email: "zaskia.nur@example.com",
    title: "Resepsionis & Office Assistant",
    skills: "Customer Service, Office Administration, Communication, Call Handling, Scheduling, Triage, Guest Welcoming, Microsoft Office, Typing Speed",
    summary: "Resepsionis profesional dengan penampilan menarik dan kemampuan komunikasi interpersonal yang sangat baik. Terbiasa menyambut tamu penting, melayani telepon masuk, serta melakukan penjadwalan ruang rapat direksi.",
    experience: "Front Desk Receptionist di MegaCorp (2022 - Sekarang): Menyambut lebih dari 50 tamu per hari dan mengelola surat menyurat masuk. Admin Kantor di KlinikSehat (2020 - 2022): Mengatur reservasi pasien dan administrasi medis dasar.",
    education: "D3 Administrasi Perkantoran, Universitas Negeri Yogyakarta (2017 - 2020)"
  }
];

function buildPdfCv(appInfo) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(UPLOADS_DIR, appInfo.filename);
    const doc = new PDFDocument({ margin: 40 });
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    // Title / Name
    doc.fillColor('#2A4365')
       .fontSize(22)
       .font('Helvetica-Bold')
       .text(appInfo.name.toUpperCase(), { paragraphGap: 4 });

    // Subtitle / Job Title
    doc.fillColor('#4A5568')
       .fontSize(13)
       .font('Helvetica-Bold')
       .text(appInfo.title, { paragraphGap: 12 });

    // Contact Info
    doc.fillColor('#1A202C')
       .fontSize(10)
       .font('Helvetica')
       .text(`Email: ${appInfo.email} | Lokasi: Jakarta, Indonesia`, { paragraphGap: 8 });

    doc.moveDown(1);

    // Sections helper
    function addSection(title, content) {
      doc.fillColor('#2A4365')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text(title, { paragraphGap: 6 });

      doc.fillColor('#1A202C')
         .fontSize(10)
         .font('Helvetica')
         .text(content, { paragraphGap: 12 });
      doc.moveDown(0.5);
    }

    addSection("RINGKASAN PROFESIONAL", appInfo.summary);
    addSection("KEAHLIAN & TEKNOLOGI", appInfo.skills);
    addSection("PENGALAMAN KERJA", appInfo.experience);
    addSection("RIWAYAT PENDIDIKAN", appInfo.education);

    doc.end();

    writeStream.on('finish', () => {
      console.log(`Generated: ${appInfo.filename}`);
      resolve();
    });

    writeStream.on('error', (err) => {
      console.error(`Error generating ${appInfo.filename}:`, err);
      reject(err);
    });
  });
}

async function main() {
  console.log(`Generating 25 CV PDFs in JS inside ${UPLOADS_DIR}...`);
  for (const app of applicantsData) {
    await buildPdfCv(app);
  }
  console.log("Dataset generation COMPLETE!");
}

if (require.main === module) {
  main();
}

module.exports = { applicantsData };
