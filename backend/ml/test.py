# Ubah import di bagian atas script scorer_service.py
import joblib  # <-- Ganti 'import pickle' menjadi 'import joblib'
import os
# ... (import lainnya biarkan tetap sama)

# ─────────────────────────────────────────────────────────
# ADJUSTED: Load model menggunakan Joblib
# ─────────────────────────────────────────────────────────
# Karena Anda menyimpan vectorizer di file terpisah, arahkan ke file tersebut
VECTORIZER_PATH = os.path.join(os.path.dirname(__file__), 'vectorizer_cv.pkl')

model_data = None

def load_model():
    global model_data
    try:
        # Load menggunakan joblib sesuai dengan cara Anda menyimpannya
        tfidf_vectorizer = joblib.load(VECTORIZER_PATH)
        
        # Bungkus ke dalam dictionary agar struktur kode /score di bawahnya tidak perlu diubah
        model_data = {
            'tfidf_vectorizer': tfidf_vectorizer
        }
        
        print(f"[OK] Model vectorizer berhasil dimuat dari: {VECTORIZER_PATH}")
        print(f" Features: {len(tfidf_vectorizer.get_feature_names_out())}")
        
    except FileNotFoundError:
        print(f"[ERROR] File vectorizer tidak ditemukan di: {VECTORIZER_PATH}")
        model_data = None
    except Exception as e:
        print(f"[ERROR] Gagal load model: {e}")
        model_data = None