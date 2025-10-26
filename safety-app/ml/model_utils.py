import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier
import requests

# Globals for pipeline and fitted state
pipe = None
_model_ready = False

# Feature columns used for prediction
numeric_cols = ['latitude', 'longitude', 'hour_sin', 'hour_cos']
cat_cols = ['incident_day_of_week']


def predict_risk_label(latitude, longitude, hour, day_of_week):
    """
    Predict risk label (0=lowest, 2=highest) for a given location and time.
    Raises RuntimeError if model is not trained/fitted yet.
    Args:
        latitude (float)
        longitude (float)
        hour (int): 0-23
        day_of_week (str): 'Monday', etc.
    Returns:
        int: 0, 1, or 2
    """
    global pipe, _model_ready
    if not _model_ready:
        raise RuntimeError("Pipeline has not been trained yet. Run this module directly to train the model, or call the train_model() function in your application.")
    # Encode cyclic features
    hour_sin = np.sin(2 * np.pi * hour / 24)
    hour_cos = np.cos(2 * np.pi * hour / 24)
    # Prepare input DataFrame
    input_dict = {
        'latitude': [latitude],
        'longitude': [longitude],
        'hour_sin': [hour_sin],
        'hour_cos': [hour_cos],
        'incident_day_of_week': [day_of_week],
    }
    input_df = pd.DataFrame(input_dict)
    label = pipe.predict(input_df)[0]
    return int(label)


def train_model():
    """
    Downloads, cleans, and trains the pipeline model. Sets global pipe and marks model ready.
    """
    global pipe, _model_ready
    # --- Data download ---
    url = 'https://data.sfgov.org/resource/wg3w-h783.json'
    params = {'$limit': 50000}
    resp = requests.get(url, params=params)
    resp.raise_for_status()
    data = resp.json()
    # --- Data preprocessing ---
    df = pd.DataFrame(data)
    df['latitude'] = pd.to_numeric(df['latitude'], errors='coerce')
    df['longitude'] = pd.to_numeric(df['longitude'], errors='coerce')
    df = df.dropna(subset=['latitude', 'longitude'])
    drop_cols = [
        'row_id', 'report_datetime', 'incident_id', 'incident_number', 'filed_online', ':@computed_region_n4xg_c4py', 
        ':@computed_region_nqbw_i6c3', ':@computed_region_h4ep_8xdi', ':@computed_region_jg9y_a9du', 
        ':@computed_region_jwn9_ihcz', ':@computed_region_26cr_cadq', ':@computed_region_qgnn_b9vv',
        'data_loaded_at', 'cnn', 'data_as_of', 'cad_number', 'report_type_description',
        'supervisor_district', 'supervisor_district_2012', 'point', 'resolution',
    ]
    df = df.drop(columns=drop_cols, errors='ignore')
    df['incident_datetime'] = pd.to_datetime(df['incident_datetime'], errors='coerce')
    df['incident_hour'] = df['incident_datetime'].dt.hour
    df['incident_day_of_week'] = df['incident_datetime'].dt.day_name()
    df['incident_week'] = df['incident_datetime'].dt.isocalendar().week
    df['incident_year'] = df['incident_datetime'].dt.year
    # Cyclical hour encoding
    df['hour_sin'] = np.sin(2 * np.pi * df['incident_hour'] / 24)
    df['hour_cos'] = np.cos(2 * np.pi * df['incident_hour'] / 24)
    # Bin coordinates
    df['lat_bin'] = (df['latitude'] * 100).round(1)
    df['lon_bin'] = (df['longitude'] * 100).round(1)
    # Risk labels
    counts = (
        df.groupby(['incident_year', 'incident_week', 'lat_bin', 'lon_bin'])
        .size().rename('count_week').reset_index()
    )
    counts['rate_log'] = np.log1p(counts['count_week'])
    counts['risk_label'] = pd.qcut(counts['rate_log'], 3, labels=False, duplicates='drop')
    df = df.merge(
        counts[['incident_year', 'incident_week', 'lat_bin', 'lon_bin', 'risk_label']],
        on=['incident_year', 'incident_week', 'lat_bin', 'lon_bin'], how='left'
    )
    df = df.dropna(subset=['risk_label'])


    numeric_candidates = [
    "latitude", "longitude", "incident_hour", "incident_week",
    "incident_year", "hour_sin", "hour_cos", "lat_bin", "lon_bin"
    ]
    for col in numeric_candidates:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Fill NaN coordinates if any after conversion
    df = df.dropna(subset=["latitude", "longitude"])

    # Final feature matrix/labels
    X = df[numeric_cols + cat_cols]
    y = df['risk_label']

    # --- Pipeline definition ---
    num_pipe = Pipeline([
        ('impute', SimpleImputer(strategy='median')),
        ('scale', StandardScaler())
    ])
    cat_pipe = Pipeline([
        ('impute', SimpleImputer(strategy='most_frequent')),
        ('ohe', OneHotEncoder(handle_unknown='ignore'))
    ])
    preproc = ColumnTransformer([
        ('num', num_pipe, numeric_cols),
        ('cat', cat_pipe, cat_cols),
    ])
    pipe = Pipeline([
        ('preproc', preproc),
        ('clf', GradientBoostingClassifier(
            n_estimators=500, min_samples_split=10, min_samples_leaf=5, max_features=None, 
            max_depth=5, learning_rate=0.05, random_state=0))
    ])

    # Ensure all numeric columns are actually numeric
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # Drop rows where conversion failed
    df = df.dropna(subset=numeric_cols)
    print("Dtypes after conversion:\n", df[numeric_cols].dtypes)

    pipe.fit(X, y)
    _model_ready = True
    print("Model training complete. You may now use predict_risk_label.")


if __name__ == "__main__":
    train_model()
    # Optionally, run evaluation or test code here. For example:
    # Example usage after training:
    print("Risk at Civic Center 11pm Monday:", predict_risk_label(37.7798, -122.4148, 23, "Monday"))

