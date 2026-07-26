"""
TalentSift v2 — Python Scoring Microservice (Flask)
DIREKAYASA ULANG: Menggunakan Sentence-BERT Multilingual & Advanced PDF-Cleansing.

Jalankan: python scorer_service.py
Port default: 5001
"""

import os
import re
import time
from collections import Counter

from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer

# Load environment variables if python-dotenv is available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Record process startup time
START_TIME = time.time()
MODEL_NAME = os.getenv('MODEL_NAME', 'paraphrase-multilingual-MiniLM-L12-v2')

# ─────────────────────────────────────────────
# Keyword Extraction (Insight Generator)
# ─────────────────────────────────────────────
STOPWORDS = {
    "yang", "dan", "di", "dengan", "untuk", "pada", "adalah", "ini", "itu", "atau", "dari", 
    "kami", "anda", "sebagai", "dalam", "mampu", "memiliki", "pengalaman", "kerja", "tahun",
    "the", "and", "in", "to", "with", "for", "on", "is", "are", "this", "that", "or", "of",
    "we", "you", "as", "experience", "years", "work", "skills", "ability", "able", "team",
    "strong", "good", "excellent", "working", "knowledge", "required", "preferred", "understanding",
    "minimal", "maksimal", "minimum", "maximum", "dicari", "dibutuhkan", "kandidat", "candidate",
    "akan", "bisa", "harus", "must", "have", "has", "be", "an", "a", "it", "by", "not", "all",
    "can", "will", "your", "our", "at", "about", "more", "also", "any", "other", "such", "using",
    "both", "well", "plus", "related", "field", "degree", "bachelor", "master",
    "company", "project", "projects", "role", "join", "looking", "seeking",
    "job", "description", "requirements", "responsibilities", "qualifications",
    "kualifikasi", "persyaratan", "tanggung", "jawab", "deskripsi", "pekerjaan", "posisi",
    "membuat", "mengembangkan", "mendukung", "menjaga", "menguji", "lingkungan", "sistem",
    "perusahaan", "proyek", "peran", "bergabung", "mencari", "pelamar", "melakukan", 
    "pendidikan", "lulusan", "sarjana", "diploma", "sma", "smk", "memahami", "menguasai", 
    "terkait", "bidang", "jurusan", "kemampuan", "keterampilan", "baik", "sangat", "lisan", 
    "tulisan", "aktif", "pasif", "bahasa", "inggris", "indonesia", "komunikasi", "bertanggung",
    "bersedia", "ditempatkan", "penempatan", "full", "time", "part", "freelance", "contract"
}

def split_into_units(text):
    units = re.split(r'[\n•;\.]+', text)

    return [
        unit.strip()
        for unit in units
        if len(unit.strip().split()) >= 3
    ]


def get_semantic_insights_fast(jd_requirements, jd_embeddings, cv_text):
    cv_units = split_into_units(cv_text)[:25]

    if not jd_requirements or not cv_units or jd_embeddings is None:
        return []

    cv_embeddings = model.encode(
        cv_units,
        batch_size=32,
        show_progress_bar=False,
        normalize_embeddings=True
    )

    similarity_matrix = cosine_similarity(
        jd_embeddings,
        cv_embeddings
    )

    insights = []

    for i, requirement in enumerate(jd_requirements):
        best_index = similarity_matrix[i].argmax()
        best_score = float(similarity_matrix[i][best_index])
        best_evidence = cv_units[best_index]

        if best_score >= 0.70:
            status = "matched"
        elif best_score >= 0.50:
            status = "partial"
        else:
            status = "missing"

        insights.append({
            "requirement": requirement,
            "status": status,
            "similarity": round(best_score * 100, 2),
            "cv_evidence": (
                best_evidence
                if status != "missing"
                else None
            )
        })

    return insights


def get_semantic_insights(jd_text, cv_text):
    jd_requirements = split_into_units(jd_text)[:15]
    if not jd_requirements:
        return []
    jd_embeddings = model.encode(
        jd_requirements,
        batch_size=32,
        show_progress_bar=False,
        normalize_embeddings=True
    )
    return get_semantic_insights_fast(jd_requirements, jd_embeddings, cv_text)

app = Flask(__name__)

# Configure CORS for production readiness
origins_env = os.getenv('ALLOWED_ORIGINS', '*')
if origins_env == '*':
    CORS(app)
else:
    allowed_list = [o.strip() for o in origins_env.split(',') if o.strip()]
    CORS(app, resources={r"/*": {"origins": allowed_list}})

# ─────────────────────────────────────────────
# Gerbang Utama: Load Model SBERT ke Memory (Global Variable)
# ─────────────────────────────────────────────
model = None

def load_model():
    global model
    try:
        print(f"Loading SBERT Model [{MODEL_NAME}] into memory...")
        model = SentenceTransformer(MODEL_NAME)
        print(f"[OK] Successfully loaded SBERT model [{MODEL_NAME}]")
    except Exception as e:
        print(f"[ERROR] Gagal load model SBERT: {e}")
        model = None

# Automatically load model on module import for Gunicorn & WSGI production servers
load_model()


# ─────────────────────────────────────────────
# Advanced Pre-processing (Penyelamat Spasi Hancur dari Google Colab)
# ─────────────────────────────────────────────
def preprocess_text_sbert(text):
    if not isinstance(text, str):
        return ''
    
    # 1. Menghapus spasi dan merapatkan kata yang terpisah
    text = re.sub(r'(?<=\b\w)\s(?=\w\b)', '', text)
    
    # 2. Hapus Noise Data (Email, URL, Nomor HP) 
    text = re.sub(r'\S+@\S+', ' ', text)
    text = re.sub(r'http\S+|www\.\S+', ' ', text)
    text = re.sub(r'\+?\d[\d -]{8,12}\d', ' ', text)
    
    # 3. Normalisasi karakter spasi ganda
    text = re.sub(r'\s+', ' ', text).strip()
    return text


# ─────────────────────────────────────────────
# ENDPOINT: POST /score
# Body: { "cv_text": "...", "job_description": "..." }
# Response: { "score": 44.89, "label": "Review Needed", "raw_score": 0.4489, ... }
# ─────────────────────────────────────────────
@app.route('/score', methods=['POST'])
def score():
    if model is None:
        return jsonify({'error': 'SBERT Model not loaded'}), 503

    data = request.get_json() or {}
    cv_text = data.get('cv_text', '')
    job_description = data.get('job_description', '')

    if not cv_text or not job_description:
        return jsonify({'error': 'cv_text and job_description are required'}), 400

    try:
        # Preprocessing
        clean_jd = preprocess_text_sbert(job_description)
        clean_cv = preprocess_text_sbert(cv_text)
        
        # Hitung Vector Embedding kontekstual menggunakan SBERT
        vec_jd = model.encode([clean_jd])
        vec_cv = model.encode([clean_cv])

        # Hitung Cosine Similarity
        raw_score = float(cosine_similarity(vec_cv, vec_jd)[0][0])
        display_score = min(round(raw_score * 100, 2), 100.0) 

        # Menentukan Label Kelayakan (Sesuai Logic Lama)
        if display_score >= 80:
            label = 'Lolos'
        elif display_score >= 60:
            label = 'Rekomendasi'
        else:
            label = 'Kurang Cocok'

        # Dapatkan Insight (Matched & Missing Keywords)
        insights = get_semantic_insights(
            clean_jd,
            clean_cv
        )

        matched_count = sum(1 for i in insights if i['status'] == 'matched')
        partial_count = sum(1 for i in insights if i['status'] == 'partial')
        missing_count = sum(1 for i in insights if i['status'] == 'missing')
        
        insight_summary = {
            "total_requirements": len(insights),
            "matched": matched_count,
            "partial": partial_count,
            "missing": missing_count
        }

        return jsonify({
            'score': display_score,
            'raw_score': round(raw_score, 4),
            'label': label,
            'requirement_analysis': insights,
            'insight_summary': insight_summary
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────
# ENDPOINT: POST /score-batch
# Body: { "applicants": [{"id":1,"cv_text":"..."},...], "job_description":"..." }
# Response: { "results": [{"id":1,"score":44.89,"label":"..."},...] }
# ─────────────────────────────────────────────
@app.route('/score-batch', methods=['POST'])
def score_batch():
    if model is None:
        return jsonify({'error': 'SBERT Model not loaded'}), 503

    data = request.get_json() or {}
    applicants = data.get('applicants', [])
    job_description = data.get('job_description', '')

    if not applicants or not job_description:
        return jsonify({'error': 'applicants and job_description are required'}), 400

    try:
        # Embed lowongan kerja sekali saja (Efisiensi Komputasi)
        clean_jd = preprocess_text_sbert(job_description)
        vec_jd = model.encode([clean_jd], batch_size=32, show_progress_bar=False)

        # Pre-encode requirements ONCE for the entire batch (Huge Performance Optimization)
        jd_requirements = split_into_units(clean_jd)[:15]
        if jd_requirements:
            jd_req_embeddings = model.encode(
                jd_requirements,
                batch_size=32,
                show_progress_bar=False,
                normalize_embeddings=True
            )
        else:
            jd_req_embeddings = None

        results = []
        for applicant in applicants:
            aid = applicant.get('id')
            cv_text = applicant.get('cv_text', '')

            if not cv_text:
                results.append({'id': aid, 'score': 0, 'label': 'Review Needed'})
                continue

            clean_cv = preprocess_text_sbert(cv_text)
            vec_cv = model.encode([clean_cv], batch_size=32, show_progress_bar=False)

            raw_score = float(cosine_similarity(vec_cv, vec_jd)[0][0])
            display_score = min(round(raw_score * 100, 2), 100.0)

            if display_score >= 80:
                label = 'Lolos'
            elif display_score >= 60:
                label = 'Rekomendasi'
            else:
                label = 'Tidak Cocok'   

            insights = get_semantic_insights_fast(
                jd_requirements,
                jd_req_embeddings,
                clean_cv
            )

            matched_count = sum(1 for i in insights if i['status'] == 'matched')
            partial_count = sum(1 for i in insights if i['status'] == 'partial')
            missing_count = sum(1 for i in insights if i['status'] == 'missing')
            
            insight_summary = {
                "total_requirements": len(insights),
                "matched": matched_count,
                "partial": partial_count,
                "missing": missing_count
            }

            results.append({
                'id': aid,
                'score': display_score,
                'label': label,
                'requirement_analysis': insights,
                'insight_summary': insight_summary
            })

        # Urutkan secara otomatis dari skor tertinggi ke terendah demi keperluan ranking dashboard
        results.sort(key=lambda r: r['score'], reverse=True)

        return jsonify({'results': results, 'total': len(results)})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────
# ENDPOINT: GET /health (Untuk Pengecekan Sistem & Production Monitoring)
# ─────────────────────────────────────────────
@app.route('/health', methods=['GET'])
def health():
    is_loaded = model is not None
    status_code = 200 if is_loaded else 503
    return jsonify({
        'status': 'ok' if is_loaded else 'degraded',
        'model_status': 'loaded' if is_loaded else 'not_loaded',
        'model_name': MODEL_NAME,
        'architecture': 'Sentence-BERT (Siamese Network)',
        'uptime_seconds': int(time.time() - START_TIME)
    }), status_code


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    host = os.getenv('HOST', '0.0.0.0')
    print(f"[START] TalentSift v2 Core SBERT running on http://{host}:{port}")
    app.run(host=host, port=port, debug=False)