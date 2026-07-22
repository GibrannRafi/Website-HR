"""
TalentSift v2 — Python Scoring Microservice

REST API untuk scoring CV menggunakan
TF-IDF + Cosine Similarity + Skill Boost
"""

from flask import Flask, request, jsonify
from flask_cors import CORS

import os
import re
import joblib
import numpy as np

app = Flask(__name__)
CORS(app)

# ============================================================
# MODEL
# ============================================================

VECTORIZER_PATH = os.path.join(
    os.path.dirname(__file__),
    "talentsift_tfidf_model.pkl"
)

model_data = None


def load_model():

    global model_data

    try:

        model = joblib.load(VECTORIZER_PATH)

        model_data = {
            "tfidf_vectorizer": model["vectorizer"],
            "cv_matrix": model["cv_matrix"],
            "metadata": model["metadata"]
        }

        tfidf = model_data["tfidf_vectorizer"]

        print("=" * 60)
        print("[OK] MODEL BERHASIL DIMUAT")
        print("=" * 60)
        print("Features :", len(tfidf.get_feature_names_out()))
        print("Training CV :", model_data["cv_matrix"].shape[0])
        print("=" * 60)

    except FileNotFoundError:

        print("[ERROR] File model tidak ditemukan")
        model_data = None

    except Exception as e:

        print("[ERROR]", e)
        model_data = None


# ============================================================
# TECHNICAL KEYWORDS
# ============================================================

TECHNICAL_KEYWORDS = {

    # UI / UX
    'figma','adobe','xd','sketch','wireframe',
    'wireframing','prototype','prototyping',
    'usability','research','design',
    'marvel','invision','interaction',
    'interface','user',

    # Frontend
    'react','vue','angular',
    'javascript','typescript',
    'html','css','tailwind',
    'bootstrap','redux','sass',
    'webpack','jquery','frontend',
    'slicing',

    # Backend
    'node','express','golang','go',
    'python','php','laravel',
    'nestjs','mysql',
    'postgresql','mongodb',
    'redis','sql','database',
    'query','api','rest',
    'graphql','jwt','docker',
    'microservices',
    'server','security',
    'c++','c#','java',

    # DevOps
    'git','github','gitlab',
    'postman','aws',
    'deploy','deployment',
    'linux','nginx'
}

# ============================================================
# PREPROCESS TEXT
# ============================================================

def preprocess_text(text):

    if not isinstance(text, str):
        return ""

    # Lowercase
    text = text.lower()

    # Normalisasi istilah
    text = re.sub(r'\bgolang\b', 'go', text)
    text = re.sub(r'\bvue\.js\b', 'vue', text)
    text = re.sub(r'\breact\.js\b', 'react', text)
    text = re.sub(r'\bml\b', 'machine learning', text)

    # Pertahankan C++ dan C#
    text = re.sub(r'[^\w\s\+\#]', ' ', text)

    # Hapus angka panjang (misal tahun)
    text = re.sub(r'\b\d{4,}\b', '', text)

    # Rapikan spasi
    text = re.sub(r'\s+', ' ', text).strip()

    # Stopwords
    stop_words = {
        "a","about","above","after","again","against","all","am","an",
        "and","any","are","as","at","be","because","been","before","being",
        "below","between","both","but","by","can","could","did","do","does",
        "doing","down","during","each","few","for","from","further","had","has",
        "have","having","he","her","here","hers","herself","him","himself","his",
        "how","i","if","in","into","is","it","its","itself","just","me","more","most",
        "my","myself","no","nor","not","now","of","off","on","once","only","or","other",
        "our","ours","ourselves","out","over","own","same","she","should","so","some",
        "such","than","that","the","their","theirs","them","themselves","then","there",
        "these","they","this","those","through","to","too","under","until","up","very",
        "was","we","were","what","when","where","which","while","who","whom","why","will",
        "with","would","you","your","yours","yourself","yourselves"
        
        }

    words = [
        word
        for word in text.split()
        if word not in stop_words
    ]

    return " ".join(words)


# ============================================================
# COSINE SIMILARITY + SKILL BOOST
# ============================================================

def calculate_similarity_with_boost(tfidf, vec_jd, vec_cv):

    feature_names = tfidf.get_feature_names_out()

    multipliers = np.array([
        2.5 if feature in TECHNICAL_KEYWORDS else 1.0
        for feature in feature_names
    ])

    arr_jd = vec_jd.toarray()[0]
    arr_cv = vec_cv.toarray()[0]

    arr_jd = arr_jd * multipliers
    arr_cv = arr_cv * multipliers

    jd_norm = np.linalg.norm(arr_jd)
    cv_norm = np.linalg.norm(arr_cv)

    if jd_norm > 0:
        arr_jd = arr_jd / jd_norm

    if cv_norm > 0:
        arr_cv = arr_cv / cv_norm

    similarity = float(np.dot(arr_jd, arr_cv))

    return similarity


# ============================================================
# SCORE LABEL
# ============================================================

def determine_label(score):

    if score >= 80:
        return "Shortlisted"

    elif score >= 60:
        return "Screening"

    return "Review Needed"


# ============================================================
# MATCHED KEYWORDS
# ============================================================

def get_matched_keywords(tfidf, clean_cv, clean_jd, limit=15):

    features = set(tfidf.get_feature_names_out())

    cv_words = set(clean_cv.split())
    jd_words = set(clean_jd.split())

    matched = sorted(
        list(
            cv_words &
            jd_words &
            features
        )
    )

    return matched[:limit]

# ============================================================
# ENDPOINT : POST /score
# ============================================================

@app.route("/score", methods=["POST"])
def score():

    if model_data is None:
        return jsonify({
            "error": "Model not loaded"
        }), 503

    data = request.get_json()

    if data is None:
        return jsonify({
            "error": "Invalid JSON"
        }), 400

    cv_text = data.get("cv_text", "")
    job_description = data.get("job_description", "")

    if not cv_text or not job_description:
        return jsonify({
            "error": "cv_text and job_description are required"
        }), 400

    try:

        tfidf = model_data["tfidf_vectorizer"]

        # ===========================
        # PREPROCESS
        # ===========================

        clean_cv = preprocess_text(cv_text)
        clean_jd = preprocess_text(job_description)

        # ===========================
        # TF-IDF
        # ===========================

        vec_cv = tfidf.transform([clean_cv])
        vec_jd = tfidf.transform([clean_jd])

        # ===========================
        # COSINE SIMILARITY
        # ===========================

        raw_score = calculate_similarity_with_boost(
            tfidf,
            vec_jd,
            vec_cv
        )

        adjusted_score = min(
            round(float(np.sqrt(raw_score)) * 100, 2),
            100.0
        )

        label = determine_label(adjusted_score)

        matched_keywords = get_matched_keywords(
            tfidf,
            clean_cv,
            clean_jd
        )

        return jsonify({

            "score": adjusted_score,

            "raw_score": round(raw_score, 4),

            "label": label,

            "matched_keywords": matched_keywords,

            "cv_word_count": len(clean_cv.split())

        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500
        
        # ============================================================
# ENDPOINT : GET /health
# ============================================================

@app.route("/health", methods=["GET"])
def health():

    if model_data is None:
        return jsonify({
            "status": "error",
            "message": "Model not loaded"
        }), 503

    tfidf = model_data["tfidf_vectorizer"]

    return jsonify({

        "status": "ok",

        "model": "talentsift_tfidf_model.pkl",

        "features": len(tfidf.get_feature_names_out()),

        "training_cv": model_data["cv_matrix"].shape[0]

    })


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    print()
    print("=" * 60)
    print("TalentSift Scoring Service")
    print("=" * 60)

    load_model()

    if model_data is None:
        print("[ERROR] Service gagal dijalankan karena model tidak berhasil dimuat.")
        exit(1)

    print()
    print("[START] Server running...")
    print("URL    : http://127.0.0.1:5001")
    print("Health : http://127.0.0.1:5001/health")
    print()

    app.run(
        host="0.0.0.0",
        port=5001,
        debug=False
    )