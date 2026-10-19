import Router from 'express';
import authmiddleware from '../middlewares/authmiddleware';
import {GenerateQuizByAI} from '../controllers/aiquizcontroller';
const router = Router();

router.use(authmiddleware);
router.post('/generate',GenerateQuizByAI);

export default router;