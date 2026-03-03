import express from 'express';

const router = express.Router();

router.get('/ping', (_req, res) => {
  res.json({ ok: true, message: 'Reading routes are not implemented yet.' });
});

router.use((_req, res) => {
  res.status(501).json({ error: 'Reading routes not implemented' });
});

export default router;
