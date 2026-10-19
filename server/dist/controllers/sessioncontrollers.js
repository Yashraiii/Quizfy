import { prisma } from '../config/client';
const GAME_CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const generateGameRoomCode = (length = 6) => {
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * GAME_CODE_CHARS.length);
        result += GAME_CODE_CHARS[randomIndex];
    }
    return result;
};
const CreateSession = async (req, res) => {
    try {
        const { quizId } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!quizId) {
            return res.status(400).json({ message: 'Quiz ID is required' });
        }
        const quiz = await prisma.quiz.findUnique({
            where: {
                id: quizId
            }
        });
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        const roomCode = generateGameRoomCode(6);
        const session = await prisma.liveSession.create({
            data: {
                quizId,
                hostId: userId,
                roomCode,
                status: "LOBBY"
            },
            include: {
                quiz: {
                    select: {
                        title: true
                    }
                }
            }
        });
        res.status(201).json({
            message: "Live session has been created sucessfully",
            session
        });
    }
    catch (err) {
        res.status(500).json({
            message: "Internal server error"
        });
    }
};
export { CreateSession };
