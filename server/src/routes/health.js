import { Router } from 'express';

const r = Router();
r.get('/', (req, res) => res.json({ status: 'ok' }));
export default r;
