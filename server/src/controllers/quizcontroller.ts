import { Request, Response } from 'express';
import { prisma } from '../config/client';

const CreateQuiz = async (req:Request,res:Response)=>{
    try{
        const {title,description,questions,status} = req.body;
        const userId = req.user?.id;
        if(!userId){
            return res.status(401).json({message: "Unauthorized"});
        }
        const newQuiz = await prisma.quiz.create({
            data:{ 
                title,
                description,
                ownerId:userId,
                status:status||"PUBLISHED",
                quizQuestions:{
                    create:questions.map((question:any,index:number)=>({
                        order:index+1,
                        question:{
                            create:{
                                text:question.text,
                                type:question.type || "MCQ",
                                timeLimit:question.timeLimit || 20,
                                points:question.points ||1,
                                creatorId:userId,
                                options:{
                                    create:question.options.map((option:any)=>({
                                        text:option.text,
                                        isCorrect:option.isCorrect
                                    })),
                                }
                            },
                        },
                    })),
                },
            },
            include:{
                quizQuestions:{
                    include:{
                        question:{
                            include:{
                                options:true
                            }
                        }
                    }
                }
            }
        })
        res.status(201).json(newQuiz);  
    }
    catch(error){
        console.error(error);
        res.status(500).json({
            message: "Internal Server Error"
        })
    }
}

const GetUserQuizzes = async(req:Request,res:Response)=>{
    try{
        const userId = req.user?.id;
        if(!userId){
            return res.status(401).json({message: "Unauthorized"});
        }
        const quizzes = await prisma.quiz.findMany({
            where:{
                ownerId:userId
            },
            orderBy:{
                createdAt:"desc"
            },
            select: {
                id: true,
                title: true,
                description: true,
                status: true,
                createdAt: true
            }
        })
        res.status(200).json(quizzes);
    }
    catch(error){
        console.error(error);
        res.status(500).json({
            message: "Internal Server Error"
        })
    }
}
const GetQuizById = async(req:Request,res:Response)=>{
    try{
        const { id } = req.params;
        const quizId = Array.isArray(id) ? id[0] : id;

        if (!quizId) {
            return res.status(400).json({ message: "Quiz id is required" });
        }

        const quiz = await prisma.quiz.findUnique({
            where:{
                id: quizId
            },
            include:{
                quizQuestions:{
                    include:{
                        question:{
                            include:{
                                options:true
                            }
                        }
                    }
                }
            }
        })
        if(!quiz){
            return res.status(404).json({message: "Quiz not found"});
        }
        res.status(200).json(quiz);
    }
    catch(error){
        console.error(error);
        res.status(500).json({
            message: "Internal Server Error"
        })
    }
}
const DeleteQuizById = async(req:Request,res:Response)=>{
    try{
        const {id} = req.params;
        const quizId = Array.isArray(id) ? id[0] : id;
        if(!quizId){
            return res.status(400).json({message: "Quiz id is required"});
        }
        const userId = req.user?.id;
        if(!userId){
            return res.status(401).json({message: "Unauthorized"});
        }
        const quiz = await prisma.quiz.findUnique({
            where:{
                id:quizId
            }
        })
        if(!quiz){
            return res.status(404).json({message: "Quiz not found"});
        }
        if(quiz.ownerId !== userId){
            return res.status(403).json({message: "Forbidden"});
        }
        await prisma.quiz.delete({
            where:{
                id:quizId
            }
        })
        res.status(200).json({message: "Quiz deleted successfully"});
    }
    catch(error){
        console.error(error);
        res.status(500).json({
            message: "Internal Server Error"
        })
    }
}
const UpdateQuiz = async(req:Request,res:Response)=>{
    try{
        const {id} = req.params;
        const quizId = Array.isArray(id)?id[0]:id
        const userId = req.user?.id;
        if(!userId){
            return res.status(500).json({
                message:"unauthorized"
            })
        }
        const{title,description,questions,status} = req.body
        const existingQuiz = await prisma.quiz.findUnique({
            where:{
                id:quizId
            }
        })
        if(!existingQuiz){
            return res.status(404).json({
                message:"Quiz not found"
            })
        }
        if (existingQuiz.ownerId !== userId) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const updateQuiz = await prisma.$transaction(async(tx)=>{
            await tx.quizQuestion.deleteMany({
                where:{quizId}
            })
            return tx.quiz.update({
                where:{
                    id:quizId,
                },
                data:{
                    title,
                    description,
                    status:status || "PUBLISHED",
                    quizQuestions:{
                        create:questions.map((q:any,index:number)=>({
                            order:index+1,
                            question:{
                                create:{
                                    text:q.text,
                                    type:q.type ||"MCQ",
                                    timeLimit:q.timeLimit,
                                    points:q.points,
                                    creatorId:userId,
                                    options:{
                                        create:q.options.map((opt:any)=>({
                                            text:opt.text,
                                            isCorrect:opt.isCorrect
                                        }))
                                    }
                                }
                            }
                        }))
                    }
                }
            })
        });
        res.status(200).json(updateQuiz)
        

    }
    catch(error){
        console.error(error)
        res.status(500).json({
            message:"Internal Server Error"
        })
    }
}
export {CreateQuiz,GetUserQuizzes,GetQuizById,DeleteQuizById,UpdateQuiz}