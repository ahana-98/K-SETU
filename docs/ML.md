# Machine Learning Documentation

## Overview

K-SETU includes four prototype machine-learning-related modules to support e-waste material classification, value estimation, recycler recommendations, and anomaly detection.

**Current status:** All four modules use rule-based or deterministic heuristic approaches. They are prototype decision-support features, not independently validated production models. No real-world accuracy or performance claim is made.

## Prototype Modules

### 1. Material Classification

**Function:** `classifyMaterial`

**Current approach:**

* Uses keyword-based and hash-based heuristics.
* Produces a prototype material classification result.
* Does not currently represent a trained computer-vision model.

**Potential future implementation:**

* MobileNetV3 for image-based material classification.
* OpenCV for image preprocessing and related computer-vision operations.
* A labeled and reviewed dataset of representative e-waste images.

**Future validation:**

* Evaluate classification performance on a held-out dataset.
* Report per-class precision, recall, and F1 score.
* Review performance across different lighting, image quality, device, and material conditions.

### 2. Value Estimation

**Function:** `estimateValue`

**Current approach:**

The prototype estimates value using a formula based on the material rate, weight, and condition factor:

`Estimated value = Rate × Weight × Condition factor`

The result depends on the configured rate and condition assumptions. It is an illustrative estimate and not a guaranteed offer or live market valuation.

**Potential future implementation:**

* XGBoost regression using suitable pricing and transaction data.
* Candidate dataset files include `prices.csv` and `transactions.csv`, subject to availability and review.

**Future validation:**

* Compare predictions with independently collected, verified transaction outcomes.
* Evaluate using metrics such as MAE and RMSE.
* Assess performance across material categories, weights, and market conditions.
* Document data freshness and the limitations of historical prices.

### 3. Recycler Recommendation

**Function:** `rankRecyclers`

**Current approach:**

The prototype ranks recycler options using weighted rules that consider:

* Material compatibility.
* Authorization-related information.
* Pickup availability.
* Rate fairness.
* Proximity.

The ranking is a decision-support mechanism. It should not be interpreted as proof that a recycler is licensed, currently operating, or suitable for every transaction. Recycler information and authorization status require independent verification.

**Potential future improvements:**

* Validate recycler information and authorization records.
* Improve location and pickup information.
* Evaluate recommendation relevance using reviewed outcomes and user feedback.
* Document the contribution and limitations of each ranking factor.

### 4. Anomaly Detection

**Function:** `detectAnomaly`

**Current approach:**

* Compares submitted values with a local-market range.
* Flags values that fall outside the configured comparison range.
* Uses deterministic rules rather than a trained anomaly-detection model.

An anomaly flag indicates that a value may warrant review; it does not establish fraud, misconduct, or an incorrect transaction.

**Potential future implementation:**

* Isolation Forest for unsupervised anomaly detection.
* Suitable historical data with documented provenance and quality checks.
* Human review of flagged records.

**Future validation:**

* Evaluate false-positive and false-negative rates.
* Review flagged cases with domain experts.
* Test performance across different materials and market conditions.
* Monitor changes in data distributions over time.

## Dataset and Data Quality

Prototype CSV datasets are located in:

```text
ml/datasets/
```

The available dataset mirrors are synthetic/demo resources intended for future experimentation. They should not be treated as verified real-world observations or production-ready training data.

Before training or evaluating models, the team should:

* Confirm dataset provenance, licensing, and permitted use.
* Review labels, missing values, duplicates, and class balance.
* Separate training, validation, and test data appropriately.
* Prevent data leakage between related records.
* Document preprocessing, feature definitions, and dataset versions.
* Use representative, consented, and quality-checked data where real-world data is required.

See [Dataset Documentation](./DATASET.md) for the seeded demo data and its limitations.

## Evaluation and Reporting

No real-world accuracy claim is made for the current heuristic modules.

Future model evaluations should clearly document:

* The dataset and its collection period.
* The evaluation population and sampling method.
* Training and test methodology.
* Metrics appropriate to each task.
* Known limitations and sources of bias.
* Human-review procedures for consequential outputs.

Prototype estimates and recommendations should be presented as decision support. They should not replace appropriate human judgment, safety procedures, or independent verification.

## Responsible Use

* Clearly label prototype outputs as estimates, suggestions, or flags.
* Do not present heuristic outputs as validated predictions.
* Do not treat anomaly flags as evidence of fraud.
* Do not treat recycler rankings as certification or authorization.
* Keep human review available for important operational decisions.
* Avoid unsupported claims about environmental impact, financial savings, or model performance.

## Future Development Roadmap

1. Review and document the available synthetic datasets.
2. Identify suitable real-world data sources and obtain necessary permissions.
3. Define task-specific labels, features, and evaluation criteria.
4. Build and validate candidate models using appropriate training and test procedures.
5. Compare candidate models with the current heuristic baselines.
6. Integrate validated models behind stable application interfaces.
7. Monitor performance, data quality, and limitations after deployment.

## Related Documentation

* [Architecture](./ARCHITECTURE.md)
* [API Reference](./API.md)
* [Dataset](./DATASET.md)
* [Database](./DATABASE.md)
* [Field Research](./FIELD_RESEARCH.md)
* [Unit Economics](./UNIT_ECONOMICS.md)