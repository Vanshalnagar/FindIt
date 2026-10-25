import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { validate, validateObjectId } from '../middleware/validate.js';
import { adminListSchema, hideSchema } from '../controllers/schemas.js';
import * as a from '../controllers/adminController.js';

const r = Router();
r.param('id', validateObjectId());
r.use(requireAdmin);
r.get('/stats', a.stats);
r.get('/items', validate(adminListSchema, 'query'), a.listItems);
r.patch('/items/:id/hide', validate(hideSchema), a.hideItem);
r.get('/users', a.listUsers);
export default r;
