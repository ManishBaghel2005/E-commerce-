import express from 'express';
import { createLead, getAllLeads } from '../controllers/lead.controllers.js';

const router = express.Router();

router.post('/newlead', createLead);
router.get('/', getAllLeads)

export default router;