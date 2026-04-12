import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import presentationRoutes from './routes/presentationRoutes.js';

dotenv.config();

const app = express();


app.use(cors());


app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));


app.use('/api/presentation', presentationRoutes);


app.get('/', (req, res) => {
    res.send("EZ Presentation AI Agent Server is Running! 🚀");
});


const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});