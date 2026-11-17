import { runIngestion } from '../services/ingestion/runIngestion.js';
import { runClassification } from '../services/classification/runClassification.js';

export async function triggerIngestion(req, res, next) {
  try {
    const result = await runIngestion({ trigger: 'admin' });
    const statusCode = result.status === 'locked' ? 409 : result.ok ? 200 : 500;
    res.status(statusCode).json({ ok: result.ok, data: result });
  } catch (error) {
    next(error);
  }
}

export async function triggerClassification(req, res, next) {
  try {
    const limit = Number(req.body?.limit || 200);
    const force = Boolean(req.body?.force);
    const result = await runClassification({
      trigger: 'admin',
      limit,
      force,
    });
    const statusCode = result.status === 'locked' ? 409 : result.ok ? 200 : 500;
    res.status(statusCode).json({ ok: result.ok, data: result });
  } catch (error) {
    next(error);
  }
}
