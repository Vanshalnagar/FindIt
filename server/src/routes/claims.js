import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate, validateObjectId } from '../middleware/validate.js';
import { updateClaimSchema } from '../controllers/schemas.js';
import * as claims from '../controllers/claimController.js';

const r = Router();
r.param('id', validateObjectId());
r.get('/mine', requireAuth, claims.mine);
r.patch('/:id', requireAuth, validate(updateClaimSchema), claims.updateStatus);
export default r;
