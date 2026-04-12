import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import presentationRoutes from './routes/presentationRoutes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());

// 🔥 THE FIX: Payload limit increased to 50MB for large Hackathon documents
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/presentation', presentationRoutes);

// Test Route
app.get('/', (req, res) => {
    res.send("EZ Presentation AI Agent Server is Running! 🚀");
});

// Start Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});