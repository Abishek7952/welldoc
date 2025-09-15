# ml/generate_synthetic_uci_with_seq.py
"""
Generate synthetic CGM-like time-series + aggregated features + sequences.
This version fixes the data leakage AND introduces a subtle, learnable signal.
"""

from pathlib import Path
import numpy as np
import pandas as pd
import json, random, math
from datetime import datetime, timedelta

# ---------- Config ----------
SEED = 42
random.seed(SEED)
np.random.seed(SEED)

RAW_OUT = Path("data/raw/synthetic_uci")
OUT_DIR = Path("data/processed")
RAW_OUT.mkdir(parents=True, exist_ok=True)
OUT_DIR.mkdir(parents=True, exist_ok=True)

FEATURE_CSV = OUT_DIR / "synthetic_uci_features.csv"
SEQ_NPY = OUT_DIR / "synthetic_sequences.npy"
SEQ_INDEX = OUT_DIR / "synthetic_seq_index.json"
LOG_JSON = OUT_DIR / "synthetic_gen_log.json"

N_PATIENTS = 300
MIN_DAYS = 5
MAX_DAYS = 14
READING_INTERVAL_MIN = 15
SEQ_LEN = int((24 * 60) / READING_INTERVAL_MIN)
HYPER_THRESHOLD = 180.0

# ---------- Helpers (Now included) ----------
def to_seconds_array(timestamps):
    try:
        ts = pd.to_datetime(timestamps)
        secs = ts.astype("int64").to_numpy(dtype="int64") / 1e9
        return secs.astype(float)
    except Exception:
        out = [float(pd.to_datetime(t).value) / 1e9 if not pd.isna(t) else 0.0 for t in timestamps]
        return np.array(out, dtype=float)

def rolling_window_auc_over_threshold(values, timestamps, threshold, window_minutes):
    vals = np.asarray(values, dtype=np.float64)
    if np.all(np.isnan(vals)): return 0.0
    vals = pd.Series(vals).ffill().bfill().to_numpy(dtype=np.float64)
    times_sec = to_seconds_array(timestamps)
    n = len(vals)
    if n == 0: return 0.0
    dt = np.diff(times_sec) / 60.0
    if len(dt) == 0: return 0.0
    last_dt = float(np.median(dt))
    dt = np.append(dt, last_dt)
    over = np.maximum(vals - threshold, 0.0)
    contributions = over * dt
    max_auc = 0.0
    left = 0
    cur_sum = 0.0
    for right in range(n):
        cur_sum += float(contributions[right])
        while (times_sec[right] - times_sec[left]) / 60.0 > window_minutes:
            cur_sum -= float(contributions[left])
            left += 1
        if cur_sum > max_auc:
            max_auc = cur_sum
    return float(max_auc)

# ---------- Simulation functions ----------
def simulate_patient(days, baseline_mean=110.0, high_variability=False):
    total_points = days * SEQ_LEN
    start_ts = datetime.now() - timedelta(days=days)
    times = [start_ts + timedelta(minutes=i * READING_INTERVAL_MIN) for i in range(total_points)]
    circ_amp = np.random.uniform(3, 12)
    circ_phase = np.random.uniform(0, 2 * math.pi)
    t_secs = np.arange(total_points) * READING_INTERVAL_MIN * 60.0
    circadian = circ_amp * np.sin(2 * math.pi * t_secs / (24 * 3600) + circ_phase)
    baseline = np.clip(np.random.normal(baseline_mean, 12.0), 70, 140)
    g = np.random.normal(baseline, 8.0, size=total_points) + circadian
    for d in range(days):
        meals_count = random.choice([2, 3, 3, 4])
        day_start = d * SEQ_LEN
        for _ in range(meals_count):
            idx = day_start + random.randint(int(SEQ_LEN * 0.2), int(SEQ_LEN * 0.85))
            if high_variability:
                spike_size = np.random.normal(60, 30)
            else:
                spike_size = np.random.normal(40, 25)
            spike_size = max(5.0, spike_size)
            decay_len = random.randint(5, 12)
            rise_len = random.randint(1, 3)
            for k in range(decay_len):
                pos = idx + k
                if pos < total_points:
                    factor = (1 - math.exp(-0.6 * (k + 1))) if k < rise_len else math.exp(-0.35 * (k - rise_len))
                    g[pos] += spike_size * factor * (1 + np.random.normal(0, 0.12))
    if random.random() < 0.45:
        ex_idx = random.randint(0, max(0, total_points - 1))
        for k in range(0, random.randint(4, 12)):
            pos = ex_idx + k
            if pos < total_points: g[pos] -= np.random.normal(6, 3)
    if random.random() < 0.45:
        num_inj = random.randint(0, days * 2)
        inj_indices = random.sample(range(total_points), k=num_inj) if num_inj > 0 else []
        for idx in inj_indices:
            for k in range(0, random.randint(6, 14)):
                pos = idx + k
                if pos < total_points: g[pos] -= np.random.normal(16, 7) * math.exp(-0.28 * k)
    g += np.random.normal(0, 5.0, size=total_points)
    drift = np.linspace(0, np.random.normal(0, 1.2), total_points)
    g += drift
    missing_mask = np.random.rand(total_points) < 0.01
    g[missing_mask] = np.nan
    df = pd.DataFrame({"timestamp": pd.to_datetime(times), "code": 58, "value": np.round(g, 2)})
    return df

def aggregate_features(df):
    g = df[df["code"] == 58].copy()
    g["value"] = pd.to_numeric(g["value"], errors="coerce")
    vals = g["value"].ffill().bfill().to_numpy(dtype=float)
    if len(vals) == 0: vals = np.array([100.0] * SEQ_LEN, dtype=float)
    mean_gluc = float(np.mean(vals))
    std_gluc = float(np.std(vals))
    cov = float(std_gluc / mean_gluc) if mean_gluc != 0 else 0.0
    q75, q25 = np.percentile(vals, [75, 25])
    iqr = float(q75 - q25)
    slopes = np.abs(np.diff(vals))
    mean_slope = float(np.mean(slopes)) if slopes.size > 0 else 0.0
    max_slope = float(np.max(slopes)) if slopes.size > 0 else 0.0
    m3 = float(np.mean((vals - mean_gluc) ** 3))
    m4 = float(np.mean((vals - mean_gluc) ** 4))
    skew = float(m3 / (std_gluc ** 3 + 1e-8))
    kurt = float(m4 / (std_gluc ** 4 + 1e-8))
    pct_above_140 = float((vals > 140).sum() / len(vals))
    hours = df["timestamp"].dt.hour.values
    day_mask = (hours >= 8) & (hours <= 20)
    night_mask = ~day_mask
    day_mean = float(np.mean(vals[day_mask])) if day_mask.any() else mean_gluc
    night_mean = float(np.mean(vals[night_mask])) if night_mask.any() else mean_gluc
    circadian_diff = abs(day_mean - night_mean)
    samp_entropy = float(np.var(np.diff(vals))) if len(vals) > 2 else 0.0
    local_rises = []
    thr_rise = 12.0
    for i in range(len(vals) - 3):
        local_slope = vals[i + 3] - vals[i]
        if local_slope > thr_rise: local_rises.append(local_slope)
    median_rise = float(np.median(local_rises)) if len(local_rises) > 0 else 0.0
    spike_flags = (slopes > 15.0).astype(int)
    short_spikes = int(((spike_flags[:-1] == 1) & (spike_flags[1:] == 0)).sum()) if len(spike_flags) > 1 else 0
    sustained_spikes = int(((spike_flags[:-2] == 1) & (spike_flags[1:-1] == 1) & (spike_flags[2:] == 1)).sum()) if len(spike_flags) > 2 else 0
    return {"mean_gluc_weak": mean_gluc, "std_gluc": std_gluc, "cov": cov, "iqr": iqr, "mean_slope": mean_slope, "max_slope": max_slope, "skew": skew, "kurtosis": kurt, "pct_above_140": pct_above_140, "circadian_diff": circadian_diff, "samp_entropy": samp_entropy, "median_rise": median_rise, "short_spikes": short_spikes, "sustained_spikes": sustained_spikes}

def build_sequence(df, seq_len, end_index=None):
    g = df[df["code"] == 58].copy()
    vals = g["value"].ffill().bfill().to_numpy(dtype=float)
    if end_index is None:
        end_index = len(vals)
    start_index = max(0, end_index - seq_len)
    seq = vals[start_index:end_index]
    if len(seq) < seq_len:
        pad_len = seq_len - len(seq)
        pad_val = seq[0] if len(seq) > 0 else 100.0
        seq = np.concatenate([np.full(pad_len, pad_val, dtype=float), seq])
    return seq.astype(np.float32)

# ---------- Main generation ----------
# ml/generate_synthetic_uci_with_seq.py

# ... (keep all the code from the previous version the same, just replace the main function)

# ---------- Main generation (Final Tweaked Logic) ----------
def main():
    records = []
    seqs = []
    seq_index = {}
    ids = [f"synt_{i+1:04d}" for i in range(N_PATIENTS)]
    random.shuffle(ids)
    n_pos = N_PATIENTS // 2
    pos_set = set(ids[:n_pos])

    for i, pid in enumerate(ids):
        days = random.randint(MIN_DAYS, MAX_DAYS)
        
        # 1. Simulate patient data with SLIGHTLY different characteristics
        if pid in pos_set:
            # FINAL TWEAK: Reduced the baseline mean from 120.0 to 116.0 to make it harder
            df = simulate_patient(days, baseline_mean=116.0, high_variability=True)
            label = 1
        else:
            # FINAL TWEAK: Increased the negative class baseline slightly from 110.0 to 112.0
            df = simulate_patient(days, baseline_mean=112.0, high_variability=False)
            label = 0

        # (The rest of the main function is identical to the previous version)
        feats = aggregate_features(df)
        feats["patient_id"] = pid
        feats["label"] = label
        
        event_start_idx = None
        
        if label == 1:
            gidx = df.index[df["code"] == 58].tolist()
            if len(gidx) > SEQ_LEN + 12:
                event_start_idx = random.randint(SEQ_LEN, len(gidx) - 12)
                precursor_start = event_start_idx - SEQ_LEN
                precursor_indices = range(precursor_start, event_start_idx)
                drift = np.linspace(0, np.random.uniform(8, 15), len(precursor_indices))
                df.loc[precursor_indices, "value"] += drift
                df.loc[precursor_indices, "value"] += np.random.normal(0, 1.5, size=len(precursor_indices))
                dur = random.randint(8, 14)
                for k in range(dur):
                    idx = event_start_idx + k
                    if idx < len(df):
                        df.loc[idx, "value"] = max(
                            HYPER_THRESHOLD + 15.0,
                            df.loc[idx, "value"] + np.random.uniform(50, 100)
                        )
        
        records.append(feats)
        seq = build_sequence(df, SEQ_LEN, end_index=event_start_idx)
        seq_index[pid] = len(seqs)
        seqs.append(seq)
        raw_path = RAW_OUT / f"{pid}.csv"
        df.to_csv(raw_path, index=False)

    df_out = pd.DataFrame(records).sample(frac=1, random_state=SEED).reset_index(drop=True)
    df_out.to_csv(FEATURE_CSV, index=False)
    seqs_arr = np.stack(seqs, axis=0)
    np.save(SEQ_NPY, seqs_arr)
    with open(SEQ_INDEX, "w") as f:
        json.dump(seq_index, f, indent=2)
    
    log_data = {"n_patients": N_PATIENTS, "positive_class_count": len(pos_set)}
    with open(LOG_JSON, "w") as f:
        json.dump(log_data, f, indent=2)

    print("--- Data Generation Complete (Final Tweak) ---")
    print("Saved features to:", FEATURE_CSV)
    print("Saved sequences to:", SEQ_NPY)
    print("Done.")

# ... (keep if __name__ == "__main__": main() at the end)
if __name__ == "__main__":
    main()