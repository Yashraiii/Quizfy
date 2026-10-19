import express from 'express';
import authRoutes from './routes/authroutes';
import quizRoutes from './routes/quizroutes';
import aiQuizRoutes from './routes/aiquizroutes';
import cors from 'cors';
import sessionRoutes from './routes/sessionroutes';
import http from 'http';
import {InitializeWebSocketServer } from './sockets/gamesocket';


const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;


app.use('/api/auth',authRoutes);

app.use('/api/quiz',quizRoutes);

app.use('/api/aiquiz',aiQuizRoutes);
app.use('/api/sessions',sessionRoutes);
const server = http.createServer(app);
InitializeWebSocketServer(server);
    

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
