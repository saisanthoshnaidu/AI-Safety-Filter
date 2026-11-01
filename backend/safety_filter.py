import os
from pathlib import Path

import numpy as np
import joblib
from scipy.sparse import hstack


_DIR = Path(__file__).parent

MODEL_PATH = _DIR / "safety_model.joblib"
VECTORIZER_PATH = _DIR / "vectorizer.joblib"
CHAR_VEC_PATH = _DIR / "char_vectorizer.joblib"
LABEL_MAP_PATH = _DIR / "label_mapping.joblib"


# ============================================================
# LOAD DIRECT MULTICLASS SAFETY MODEL
# ============================================================

missing = [
    str(p)
    for p in [
        MODEL_PATH,
        VECTORIZER_PATH,
        CHAR_VEC_PATH,
        LABEL_MAP_PATH
    ]
    if not p.exists()
]

if missing:
    raise FileNotFoundError(
        f"Missing model files: {missing}\n"
        "Run your multiclass ai-safety training script first."
    )


_model = joblib.load(MODEL_PATH)
_word_tfidf = joblib.load(VECTORIZER_PATH)
_char_tfidf = joblib.load(CHAR_VEC_PATH)
_int_to_label = joblib.load(LABEL_MAP_PATH)

print("AI Safety Filter loaded successfully")


# ============================================================
# FEATURES
# ============================================================

def _get_features(prompt: str):
    word_vec = _word_tfidf.transform([prompt])
    char_vec = _char_tfidf.transform([prompt])

    return hstack([
        word_vec,
        char_vec
    ])


# ============================================================
# TRIGGER WORD
# ============================================================

def _trigger_word(prompt: str):
    feature_names = _word_tfidf.get_feature_names_out()

    vec = _word_tfidf.transform([prompt]).toarray()[0]

    if vec.sum() == 0:
        return None

    return str(feature_names[int(np.argmax(vec))])


# ============================================================
# MULTICLASS CONFIDENCE
# ============================================================

def _confidence(features):
    scores = _model.decision_function(features)

    # Multiclass LinearSVC returns:
    # [[score_class_1, score_class_2, ...]]
    scores = np.asarray(scores).reshape(-1)

    # Convert decision scores to relative probabilities
    exp_scores = np.exp(scores - np.max(scores))
    probabilities = exp_scores / exp_scores.sum()

    return float(np.max(probabilities))


# ============================================================
# MAIN SAFETY CHECK
# ============================================================

def check_prompt(prompt: str) -> dict:

    features = _get_features(prompt)

    # Direct multiclass prediction
    pred_int = int(_model.predict(features)[0])

    category = _int_to_label[pred_int]

    is_safe = category == "safe"

    if is_safe:
        return {
            "is_safe": True,
            "category": "safe",
            "trigger_word": None,
            "confidence": _confidence(features),
        }

    trigger_word = _trigger_word(prompt)

    return {
        "is_safe": False,
        "category": category,
        "trigger_word": trigger_word,
        "confidence": _confidence(features),
    }