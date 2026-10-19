import {Router} from 'express';
import authmiddleware from '../middlewares/authmiddleware';
import {CreateSession} from '../controllers/sessioncontrollers';
const router = Router();

router.use(authmiddleware);
router.post('/create', CreateSession);
export default router;