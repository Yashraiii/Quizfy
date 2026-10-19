import { prisma } from "../config/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const SignUp = async (req, res) => {
    try {
        const { email, password } = req.body;
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: {
                email,
                hashedPassword: hashedPassword,
            },
        });
        const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.status(201).json({ token });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};
const SignIn = async (req, res) => {
    try {
        const { email, password } = req.body;
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (!existingUser) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const isPasswordValid = await bcrypt.compare(password, existingUser.hashedPassword);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const token = jwt.sign({ userId: existingUser.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.status(200).json({ token });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};
export { SignUp, SignIn };
