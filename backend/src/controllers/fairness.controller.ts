import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import fs from 'fs';
import path from 'path';

export const getFairnessMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const reportPath = path.resolve(__dirname, '../../../../ml/models/evaluation_report.json');
    if (!fs.existsSync(reportPath)) {
      return res.status(404).json({ error: 'Fairness metrics report not found. ML pipeline may need to run.' });
    }
    const data = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    res.json(data.fairness_metrics || {});
  } catch (error) {
    console.error('Error fetching fairness metrics:', error);
    res.status(500).json({ error: 'Failed to retrieve fairness metrics' });
  }
};
