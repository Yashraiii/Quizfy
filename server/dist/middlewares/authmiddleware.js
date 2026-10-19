import jwt from "jsonwebtoken";
import { prisma } from "../config/client";
const jwtSecret = process.env.JWT_SECRET;
const authmiddleware = async (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }
    try {
        const decode = jwt.verify(token, jwtSecret);
        const user = await prisma.user.findUnique({
            where: { id: decode.userId },
        });
        if (!user) {
            return res.status(401).json({ message: "INVALID TOKEN" });
        }
        const { hashedPassword, ...safeUser } = user;
        req.user = safeUser;
        next();
    }
    catch (error) {
        console.error(error);
        res.status(401).json({ message: "UNAUTHORIZED" });
    }
};
export default authmiddleware;
