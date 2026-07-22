import os
import re
import pickle
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import shutil

# Setup Paths
ML_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(ML_DIR, 'model_talentsift_v2.pkl')
BACKUP_PATH = os.path.join(ML_DIR, 'model_talentsift_v2.pkl.bak')

import sys

# Import data dari generate_dataset.py
try:
    from generate_dataset import applicants_data
except ImportError:
    # Fallback jika running di luar context path
    sys.path.append(ML_DIR)
    from generate_dataset import applicants_data

# Deskripsi Pekerjaan Target (Job Descriptions)
job_descriptions = {
    "uiux": "Kami mencari UI/UX Designer yang mahir Figma dan Adobe XD. Anda bertanggung jawab melakukan user research, membuat wireframe, prototype interaktif, merancang design system, melakukan usability testing, dan berkolaborasi erat dengan product manager serta tim frontend developer.",
    
    "frontend": "Kami mencari Frontend Developer untuk membangun aplikasi web. Tech stack utama kami adalah React, React.js, TypeScript, JavaScript, HTML5, CSS3, Tailwind CSS, Redux, Sass. Tanggung jawab meliputi integrasi REST API, membuat responsive web design, optimasi performa web, dan berkolaborasi menggunakan Git.",
    
    "backend": "Kami mencari Backend Engineer / Developer. Keahlian yang dibutuhkan adalah Node.js, Express, Go, Golang, MySQL, PostgreSQL, Redis, REST API, JWT, Docker, Git. Anda akan merancang database relasional, mengoptimalkan query, menerapkan keamanan server, serta membangun arsitektur microservices.",
    
    "fullstack": "Kami mencari Fullstack Developer. Tech stack utama kami adalah React, React.js, Node.js, Express, MySQL, PostgreSQL, JavaScript, HTML5, CSS3, Tailwind CSS, TypeScript, REST API, Git, JWT. Anda bertanggung jawab mengembangkan fitur frontend dan backend secara end-to-end."
}

# Preprocessing function — Persis seperti di scorer_service.py
def preprocess_text(text):
    if not isinstance(text, str):
        return ''
    
    # Lowercase
    text = text.lower()
    
    # Normalisasi khusus
    text = re.sub(r'\bgolang\b', 'go', text)
    text = re.sub(r'\bvue\.js\b', 'vue', text)
    text = re.sub(r'\breact\.js\b', 'react', text)
    text = re.sub(r'\bml\b', 'machine learning', text)
    
    # Hapus simbol tapi pertahankan C++ / C#
    text = re.sub(r'[^\w\s\+\#]', ' ', text)
    
    # Hapus angka panjang
    text = re.sub(r'\b\d{4,}\b', '', text)
    
    # Hapus spasi berlebih
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Stopwords (English + Indonesian common terms)
    stop_words = {
        'and', 'for', 'the', 'with', 'from', 'this', 'that', 'your', 'have', 'been', 'is', 'are',
        'dan', 'di', 'yang', 'untuk', 'adalah', 'kami', 'dengan', 'dalam', 'atau', 'sebagai', 
        'dari', 'pada', 'ke', 'ini', 'itu', 'akan', 'dapat', 'bisa', 'telah', 'sudah', 'oleh', 
        'karena', 'juga', 'saya', 'anda', 'mereka', 'kita', 'dia', 'lebih', 'tahun', 'pengalaman', 
        'mencari', 'membuat', 'merancang', 'mengembangkan', 'menggunakan', 'sangat', 'terbiasa', 
        'terhadap', 'yaitu', 'ialah', 'bahwa', 'secara', 'melakukan', 'tentang', 'klien', 'perusahaan'
    }
    words = [w for w in text.split() if w not in stop_words]
    
    return " ".join(words)

def train_and_evaluate():
    print("Preparing training corpus...")
    
    # Gabungkan semua data teks CV dan Job Descriptions untuk membentuk korpus IDF yang ideal
    corpus = []
    
    # Tambah semua text CV
    for app in applicants_data:
        cv_text = f"{app['title']} {app['skills']} {app['summary']} {app['experience']} {app['education']}"
        corpus.append(preprocess_text(cv_text))
        
    # Tambah semua Job Descriptions
    for jd_text in job_descriptions.values():
        corpus.append(preprocess_text(jd_text))
        
    # Inisialisasi TfidfVectorizer
    # sublinear_tf=True berguna agar frekuensi kata kunci yang sangat banyak di CV tidak mendominasi secara tidak proporsional
    # max_df=0.85 menyaring kata-kata umum yang muncul di >85% CV
    vectorizer = TfidfVectorizer(
        sublinear_tf=True,
        max_df=0.85,
        min_df=1
    )
    
    # Fit vectorizer ke korpus
    vectorizer.fit(corpus)
    print(f"Vectorizer successfully fitted. Vocabulary size: {len(vectorizer.get_feature_names_out())}")
    
    # Backup model lama jika ada
    if os.path.exists(MODEL_PATH):
        shutil.copyfile(MODEL_PATH, BACKUP_PATH)
        print(f"Backup created: {BACKUP_PATH}")
        
    # Save model baru
    model_data = {
        'tfidf_vectorizer': vectorizer
    }
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(model_data, f)
    print(f"New TF-IDF Model saved to: {MODEL_PATH}")
    
    # ─────────────────────────────────────────────────────────
    # EVALUASI & VALIDASI STABILITAS SKOR
    # ─────────────────────────────────────────────────────────
    print("\n" + "="*60)
    print("EVALUATION REPORT (VALIDASI STABILITAS SKOR)")
    print("="*60)
    
    # Daftar Kata Kunci Teknis untuk Skill Boost (2.5x weight)
    TECHNICAL_KEYWORDS = {
        # UI/UX
        'figma', 'adobe', 'xd', 'sketch', 'wireframe', 'wireframing', 'prototype', 'prototyping', 
        'usability', 'research', 'design', 'marvel', 'invision', 'interaction', 'interface', 'user',
        # Frontend
        'react', 'vue', 'angular', 'javascript', 'typescript', 'html', 'css', 'tailwind', 'bootstrap', 
        'redux', 'sass', 'webpack', 'jquery', 'frontend', 'slicing',
        # Backend / General PL
        'node', 'express', 'golang', 'go', 'python', 'php', 'laravel', 'nestjs', 'mysql', 'postgresql', 
        'mongodb', 'redis', 'sql', 'database', 'query', 'api', 'rest', 'graphql', 'jwt', 'docker', 
        'microservices', 'server', 'security', 'c++', 'c#', 'java',
        # Tools/DevOps
        'git', 'github', 'gitlab', 'postman', 'aws', 'deploy', 'deployment', 'linux', 'nginx'
    }
    
    # Hitung kemiripan untuk setiap pasangan
    for job_key, jd_text in job_descriptions.items():
        print(f"\nTarget Jobdesk: {job_key.upper()}")
        print("-" * 50)
        
        vec_jd = vectorizer.transform([preprocess_text(jd_text)])
        
        results = []
        for app in applicants_data:
            app_text = f"{app['title']} {app['skills']} {app['summary']} {app['experience']} {app['education']}"
            vec_cv = vectorizer.transform([preprocess_text(app_text)])
            
            # --- SKILL BOOST IMPLEMENTATION ---
            feature_names = vectorizer.get_feature_names_out()
            multipliers = np.array([2.5 if name in TECHNICAL_KEYWORDS else 1.0 for name in feature_names])
            
            arr_jd = vec_jd.toarray()[0]
            arr_cv = vec_cv.toarray()[0]
            
            arr_jd_boosted = arr_jd * multipliers
            arr_cv_boosted = arr_cv * multipliers
            
            # Re-normalize
            norm_jd = np.linalg.norm(arr_jd_boosted)
            norm_cv = np.linalg.norm(arr_cv_boosted)
            
            if norm_jd > 0:
                arr_jd_boosted = arr_jd_boosted / norm_jd
            if norm_cv > 0:
                arr_cv_boosted = arr_cv_boosted / norm_cv
                
            raw_score = np.dot(arr_jd_boosted, arr_cv_boosted)
            # ----------------------------------
            
            # Sqrt booster (sama seperti implementasi di scorer_service.py)
            adjusted_score = min(round(float(np.sqrt(raw_score)) * 100, 2), 100.0)
            
            if adjusted_score >= 80:
                label = 'Shortlisted'
            elif adjusted_score >= 60:
                label = 'Screening'
            else:
                label = 'Review'
                
            results.append((app['name'], app['filename'], adjusted_score, label))
            
        # Urutkan berdasarkan skor tertinggi
        results.sort(key=lambda x: x[2], reverse=True)
        
        for name, filename, score, label in results[:6]:
            print(f"  {score:6.2f}% | {label} | {name:<20} ({filename})")
        print("  ...")
        # Tunjukkan skor Non-IT teratas sebagai pembanding
        print("  Non-IT control check:")
        for name, filename, score, label in results:
            if "nonit" in filename:
                print(f"  {score:6.2f}% | {label} | {name:<20} ({filename})")

if __name__ == "__main__":
    train_and_evaluate()
