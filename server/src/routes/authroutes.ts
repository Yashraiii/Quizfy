import {Router} from "express";
import { SignUp, SignIn } from "../controllers/authcontroller";
import validate from "../middlewares/validate";
import { loginSchema, signupSchema } from "../validators/authvalidate";
const router = Router();

router.post("/signup", validate(signupSchema), SignUp);
router.post("/signin", validate(loginSchema), SignIn);

export default router; 