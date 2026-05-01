import os
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# =========================
# 1. ĐỌC DỮ LIỆU
# =========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "student_skill_trend_dataset_2000.csv")
MODEL_DIR = os.path.join(BASE_DIR, "saved_models")

os.makedirs(MODEL_DIR, exist_ok=True)

df = pd.read_csv(DATA_PATH)

# =========================
# 2. XÁC ĐỊNH LABEL / TARGET
# =========================
TARGETS = ["strong_skill", "weak_skill", "trend_label"]

# =========================
# 3. LOẠI BỎ CÁC CỘT KHÔNG DÙNG LÀM INPUT
# =========================
metadata_cols = ["sample_id", "user_id", "snapshot_date"]
drop_input_cols = [col for col in metadata_cols if col in df.columns]

# =========================
# 4. HÀM TRAIN 1 MODEL
# =========================
def train_one_model(dataframe: pd.DataFrame, target_col: str):
    other_targets = [c for c in TARGETS if c != target_col]

    X = dataframe.drop(columns=other_targets + [target_col] + drop_input_cols, errors="ignore")
    y = dataframe[target_col].copy()

    print(f"\n========== TRAIN TARGET: {target_col} ==========")
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    numeric_features = X_train.select_dtypes(include=["int64", "float64", "int32", "float32"]).columns.tolist()
    categorical_features = X_train.select_dtypes(include=["object", "bool"]).columns.tolist()

    numeric_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median"))
    ])

    categorical_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore"))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, numeric_features),
            ("cat", categorical_transformer, categorical_features),
        ]
    )

    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=12,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        class_weight="balanced"
    )

    clf = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("model", model)
    ])

    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    
    print(f"Accuracy ({target_col}): {acc:.4f}")

    model_path = os.path.join(MODEL_DIR, f"{target_col}_model.pkl")
    joblib.dump(clf, model_path)
    
    return clf, X.columns.tolist()

# =========================
# 5. TRAIN 3 MODEL
# =========================
if __name__ == "__main__":
    print("Bắt đầu quá trình huấn luyện mô hình...")
    feature_map = {}
    for target in TARGETS:
        model, feature_names = train_one_model(df, target)
        feature_map[target] = feature_names

    joblib.dump(feature_map, os.path.join(MODEL_DIR, "feature_map.pkl"))
    print("\nHoàn tất! Đã lưu các mô hình vào thư mục saved_models.")
