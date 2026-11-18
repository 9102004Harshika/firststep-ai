import { runIngestion } from '../services/ingestion/runIngestion.js';
import { runClassification } from '../services/classification/runClassification.js';

function responseForResult(res, result) {
  const statusCode = result.status === 'locked' ? 409 : result.ok ? 200 : 500;
  return res.status(statusCode).json({ ok: result.ok, data: result });
}

export async function triggerIngestion(req, res, next) {
  try {
    const asyncMode = Boolean(req.body?.async) || String(req.query?.async || '') === '1';

    if (!asyncMode) {
      const result = await runIngestion({ trigger: 'admin' });
      return responseForResult(res, result);
    }

    // Render Free proxies abort long HTTP requests (~15m). Start ingestion in the
    // background and let Actions poll GET /api/ingestion/runs for completion.
    let settled;
    const work = runIngestion({ trigger: 'admin' })
      .then((result) => {
        settled = result;
        return result;
      })
      .catch((error) => {
        console.error('[ingestion] background admin run failed:', error);
        throw error;
      });

    await Promise.race([
      work.then(() => 'done'),
      new Promise((resolve) => setTimeout(() => resolve('pending'), 2000)),
    ]);

    if (settled) {
      return responseForResult(res, settled);
    }

    return res.status(202).json({
      ok: true,
      data: {
        status: 'accepted',
        message: 'Ingestion started in background; poll GET /api/ingestion/runs for completion',
      },
    });
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
    return responseForResult(res, result);
  } catch (error) {
    next(error);
  }
}
