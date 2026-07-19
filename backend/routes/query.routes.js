import express from 'express';
import { createQuery, getAllQueries } from '../controllers/query.conrollers.js';

const router = express.Router();

router.post('/', createQuery);       // POST: http://localhost:5000/api/queries
router.get('/', getAllQueries);      // GET: http://localhost:5000/api/queries 

export default router;