import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/client";
import { JwtPayload } from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET as string;

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

const authmiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decode = jwt.verify(token, jwtSecret) as JwtPayload & { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decode.userId },
    });
    if (!user) {
      return res.status(401).json({ message: "INVALID TOKEN" });
    }
    const { hashedPassword, ...safeUser } = user;
    req.user = safeUser;

    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "UNAUTHORIZED" });
  }
};

export default authmiddleware;