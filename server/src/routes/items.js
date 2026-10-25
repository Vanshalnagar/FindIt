import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate, validateObjectId } from '../middleware/validate.js';
import { uploadImage } from '../middleware/upload.js';
import { createItemSchema, updateItemSchema, listItemsSchema, createClaimSchema } from '../controllers/schemas.js';
import * as items from '../controllers/itemController.js';
import * as claims from '../controllers/claimController.js';

const r = Router();
r.param('id', validateObjectId());

r.get('/', validate(listItemsSchema, 'query'), items.list);
r.get('/mine', requireAuth, items.mine);
r.post('/', requireAuth, uploadImage, validate(createItemSchema), items.create);

r.get('/:id', items.loadItem, items.getOne);
r.patch('/:id', requireAuth, items.loadItem, items.requireItemManager, uploadImage, validate(updateItemSchema), items.update);
r.post('/:id/close', requireAuth, items.loadItem, items.requireItemManager, items.close);
r.delete('/:id', requireAuth, items.loadItem, items.requireItemManager, items.remove);

r.post('/:id/claims', requireAuth, items.loadItem, validate(createClaimSchema), claims.create);
r.get('/:id/claims', requireAuth, items.loadItem, items.requireItemManager, claims.listForItem);

export default r;
