import {Request, Response} from 'express';
import { prisma } from '../config/client';
import { nanoid } from 'nanoid';
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}
const generateGameRoomCode = async (nanoId: string) => {
  const a = nanoId.slice(0, 3) + "-" + nanoId.slice(3, 6) + "-" + nanoId.slice(6, 9);
  return a.toUpperCase();
}
const CreateSession = async(req:Request,res:Response)=>{
    try{
        const {quizId} = req.body;
        const userId = req.user?.id;
        if(!userId){
            return res.status(401).json({message:'Unauthorized'});
        }
        if(!quizId){
            return res.status(400).json({message:'Quiz ID is required'});
        }
        const quiz = await prisma.quiz.findUnique({
            where:{
                id:quizId
            }
        });
        if(!quiz){
            return res.status(404).json({message:'Quiz not found'});
        }
        const roomCode = await generateGameRoomCode(nanoid(12));
        await prisma.quiz.update({
            where:{
                id:quizId
            },
            data:{
                status:"PUBLISHED"
            }
        })
        const session = await prisma.liveSession.create({
            data:{
                quizId,
                hostId:userId,
                roomCode,
                status:"LOBBY"

            },
            include:{
                quiz:{
                    select:{
                        title:true
                    }
                }
            }
        })

        res.status(201).json({
            message:"Live session has been created sucessfully",
            session
        })
    }
    catch(err){
        res.status(500).json({
            message:"Internal server error"
        })
    }
}
export {CreateSession};