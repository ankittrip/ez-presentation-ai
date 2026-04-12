import express from 'express';
import { parseMarkdown } from '../controllers/presentationController.js';

const router = express.Router();

router.post("/generate", parseMarkdown);

export default router; // <--- Make sure this line exists!