ML artifacts and models
======================

This folder contains code and utilities for training and scoring ML models used by the project.

Do not commit large binary model files into the repo. Instead you can either:

- Train the model locally using the provided training script:

  ```bash
  python ml/train_v2.py
  ```

- Or place pre-trained model files under `ml/models/` if you have them (files should be named `safecred_model.pkl`, `scaler.pkl`, etc.).

If you add model files locally, make sure they are excluded from git by `.gitignore` (already configured).

Helpful files:
- `train_v2.py` - training script that writes model artifacts to `ml/models/`.
- `scoring.py` - scoring logic that loads model artifacts from `ml/models/`.

If you want me to add an automated download helper for hosted models, provide a URL or storage location and I'll add a `download_models.*` script.
