import {Router} from 'express';
import authmiddleware from '../middlewares/authmiddleware';
import{CreateQuiz,GetUserQuizzes,GetQuizById,DeleteQuizById, UpdateQuiz} from '../controllers/quizcontroller';
const router = Router();

router.use(authmiddleware);
router.post('/create',CreateQuiz);
router.get('/userquizzes',GetUserQuizzes);
router.get('/:id',GetQuizById);
router.delete('/:id',DeleteQuizById);
router.put('/:id',UpdateQuiz)

export default router;