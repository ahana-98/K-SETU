# ML
Four modules, all clearly labeled PROTOTYPE (rule-based / deterministic fallbacks):
1. Material classification (`classifyMaterial`) — keyword + hash heuristic.
   Swap-in: MobileNetV3 + OpenCV.
2. Value estimation (`estimateValue`) — rate × weight × condition factor.
   Swap-in: XGBoost regressor over prices.csv/transactions.csv.
3. Recycler recommendation (`rankRecyclers`) — weighted rule ranking
   (material match, authorization, pickup, rate fairness, proximity).
4. Anomaly detection (`detectAnomaly`) — range comparison vs local market.
   Swap-in: Isolation Forest.
Datasets in /ml/datasets are SYNTHETIC/DEMO. No real-world accuracy is claimed.
