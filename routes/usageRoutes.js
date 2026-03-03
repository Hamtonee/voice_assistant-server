import express from 'express';

const router = express.Router();

router.get('/ping', (_req, res) => {
  res.json({ ok: true, message: 'Usage routes are not implemented yet.' });
});

router.use((_req, res) => {
  res.status(501).json({ error: 'Usage routes not implemented' });
});

export default router;
