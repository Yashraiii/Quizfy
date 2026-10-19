import { WebSocketServer, WebSocket } from 'ws';
import { prisma } from "../config/client";
const rooms = new Map();
const calculateScore = (isCorrect, currentStreak, timeTakenMs, timeLimitSec, maxPoints = 1000) => {
    if (!isCorrect) {
        return { pointsAwarded: 0, newStreak: 0 };
    }
    const timeLimitMs = timeLimitSec * 1000;
    const responseRatio = Math.min(Math.max(timeTakenMs / timeLimitMs, 0), 1);
    const basePoints = Math.round(maxPoints * (1 - responseRatio / 2));
    const newStreak = currentStreak + 1;
    const streakBonus = Math.min((newStreak - 1) * 100, 500);
    return { pointsAwarded: basePoints + streakBonus, newStreak };
};
const InitializeWebSocketServer = (httpServer) => {
    const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
    wss.on('connection', (ws) => {
        let currentRoomCode = null;
        let participantId = null;
        let isHost = false;
        ws.on('message', async (rawMessage) => {
            try {
                const data = JSON.parse(rawMessage.toString());
                const { type, payload } = data;
                switch (type) {
                    case 'JOIN_ROOM':
                        {
                            const { roomCode, displayName, isHost: hostflag } = payload;
                            //converting room code to upppercase and trimming whitespace to ensure consistency
                            const normalizedRoomCode = roomCode.trim().toUpperCase();
                            const session = await prisma.liveSession.findUnique({
                                where: { roomCode: normalizedRoomCode },
                                include: { quiz: true }
                            });
                            if (!session) {
                                ws.send(JSON.stringify({ type: 'ERROR', message: 'Room not found.' }));
                                return;
                            }
                            if (session.status == 'FINISHED') {
                                ws.send(JSON.stringify({ type: 'ERROR', message: 'Session has already finished.' }));
                            }
                            //check if the room already exists in the rooms map, if not create a new room state
                            if (!rooms.has(normalizedRoomCode)) {
                                rooms.set(normalizedRoomCode, {
                                    sessionId: session.id,
                                    quizId: session.quizId,
                                    hostSocket: null,
                                    players: new Map(),
                                    currentQuestionIndex: 0,
                                    questionStartTime: null,
                                    answersReceived: new Map(),
                                    timerId: null
                                });
                            }
                            const room = rooms.get(normalizedRoomCode);
                            currentRoomCode = normalizedRoomCode;
                            if (hostflag) {
                                isHost = true;
                                room.hostSocket = ws;
                                ws.send(JSON.stringify({
                                    type: 'Host_connected',
                                    payLoad: {
                                        roomCode: normalizedRoomCode,
                                        quizTitle: session.quiz.title
                                    }
                                }));
                                return;
                            }
                            else {
                                if (!displayName) {
                                    return ws.send(JSON.stringify({ type: 'ERROR', message: 'Display name is required for players.' }));
                                }
                            }
                            //create a new participant in the database and add them to the room's players map
                            const participant = await prisma.participant.create({
                                data: {
                                    sessionId: session.id,
                                    displayName: displayName
                                }
                            });
                            participantId = participant.id;
                            room.players.set(participantId, {
                                participantId,
                                displayName,
                                ws: ws,
                                score: 0,
                                streak: 0
                            });
                            ws.send(JSON.stringify({
                                type: 'JOINED_ROOM',
                                payload: {
                                    roomCode: normalizedRoomCode,
                                    participantId: participant.id,
                                    displayName: participant.displayName
                                }
                            }));
                            // Notify the host that a new player has joined
                            if (room.hostSocket && room.hostSocket.readyState === WebSocket.OPEN) {
                                room.hostSocket.send(JSON.stringify({
                                    type: 'PLAYER_JOINED',
                                    payload: {
                                        participantId: participant.id,
                                        displayName: participant.displayName,
                                        totalPlayers: room.players.size
                                    }
                                }));
                            }
                        }
                        break;
                    case 'START_QUIZ': {
                        if (!isHost || !currentRoomCode || !rooms.has(currentRoomCode)) {
                            return;
                        }
                        const room = rooms.get(currentRoomCode);
                        await prisma.liveSession.update({
                            where: { id: room.sessionId },
                            data: { status: 'QUESTION_ACTIVE', startedAt: new Date() }
                        });
                        runAutomatedQuiz(room, 0);
                        break;
                    }
                    case 'SUBMIT_ANSWER': {
                        if (isHost || !currentRoomCode || !participantId || !rooms.has(currentRoomCode)) {
                            return;
                        }
                        const room = rooms.get(currentRoomCode);
                        const player = rooms.get(currentRoomCode).players.get(participantId);
                        // Ensure the player exists and the question is active
                        if (!player || !room.questionStartTime) {
                            return;
                        }
                        if (room.answersReceived.has(participantId)) {
                            return ws.send(JSON.stringify({ type: 'ERROR', message: 'Answer already submitted for this question.' }));
                        }
                        const { selectedOptionIds } = payload;
                        const timeTakenMs = Date.now() - room.questionStartTime;
                        const quizQuestion = await prisma.quizQuestion.findFirst({
                            where: { quizId: room.quizId, order: room.currentQuestionIndex + 1 },
                            include: {
                                question: {
                                    include: { options: true }
                                }
                            }
                        });
                        if (!quizQuestion) {
                            return;
                        }
                        const correctOptionIds = quizQuestion.question.options.filter(o => o.isCorrect).map(o => o.id);
                        const isCorrect = selectedOptionIds.length === correctOptionIds.length && selectedOptionIds.every((id) => correctOptionIds.includes(id));
                        const { pointsAwarded, newStreak } = calculateScore(isCorrect, player.streak, timeTakenMs, quizQuestion.question.timeLimit, quizQuestion.question.points);
                        player.score += pointsAwarded;
                        player.streak = newStreak;
                        room.answersReceived.set(participantId, {
                            selectedOptionIds,
                            isCorrect,
                            pointsAwarded,
                            timeTakenMs
                        });
                        await prisma.participantAnswer.create({
                            data: {
                                participantId,
                                questionId: quizQuestion.questionId,
                                selectedOptionIds,
                                isCorrect,
                                pointsAwarded,
                                timeTakenMs
                            }
                        });
                        ws.send(JSON.stringify({
                            type: 'ANSWER_RECEIVED',
                            payload: {
                                isCorrect,
                                pointsAwarded,
                                totalScore: player.score,
                                streak: newStreak
                            }
                        }));
                        if (room.hostSocket && room.hostSocket.readyState === WebSocket.OPEN) {
                            room.hostSocket.send(JSON.stringify({
                                type: 'ANSWER_COUNT_UPDATE',
                                payload: {
                                    totalAnswers: room.answersReceived.size,
                                    totalPlayers: room.players.size
                                }
                            }));
                        }
                        if (room.answersReceived.size === room.players.size) {
                            // All players have answered, proceed to next question or end quiz
                            if (room.timerId) {
                                clearTimeout(room.timerId);
                                finishQuestionAndAdvance(room);
                            }
                        }
                        break;
                    }
                }
            }
            catch (err) {
                console.error("WebSocket error:", err);
                ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid WebSocket payload.' }));
            }
        });
        ws.on('close', () => {
            if (currentRoomCode && rooms.has(currentRoomCode)) {
                const room = rooms.get(currentRoomCode);
                if (participantId) {
                    room.players.delete(participantId);
                }
            }
        });
    });
};
const runAutomatedQuiz = async (room, questionIndex) => {
    const question = await prisma.quizQuestion.findFirst({
        where: { quizId: room.quizId, order: questionIndex + 1 },
        include: {
            question: {
                include: { options: {
                        select: { id: true, text: true }
                    } }
            }
        }
    });
    if (!question) {
        return finishGameAutomatically(room);
    }
    room.currentQuestionIndex = questionIndex;
    room.questionStartTime = Date.now();
    room.answersReceived.clear();
    const timeLimitSec = question.question.timeLimit;
    const targetTime = Date.now() + (timeLimitSec * 1000);
    broadcastToRoom(room, {
        type: 'QUESTION_START',
        payload: {
            questionIndex: questionIndex + 1,
            text: question.question.text,
            type: question.question.type,
            timeLimit: question.question.timeLimit,
            targetTime,
            options: question.question.options
        }
    });
    if (room.timerId) {
        clearTimeout(room.timerId);
    }
    room.timerId = setTimeout(() => {
        finishQuestionAndAdvance(room);
    }, timeLimitSec * 1000);
};
const finishQuestionAndAdvance = async (room) => {
    if (room.timerId) {
        clearTimeout(room.timerId);
    }
    const question = await prisma.quizQuestion.findFirst({
        where: { quizId: room.quizId, order: room.currentQuestionIndex + 1 },
        include: {
            question: {
                include: { options: true }
            }
        }
    });
    const correctOptionIds = question?.question.options.filter(o => o.isCorrect).map(o => o.id) || [];
    broadcastToRoom(room, {
        type: 'QUESTION_RESULTS',
        payload: {
            correctOptionIds,
            totalAnswers: room.answersReceived.size,
        }
    });
    room.timerId = setTimeout(() => {
        const sortedPlayers = Array.from(room.players.values()).sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map((p, index) => ({
            rank: index + 1,
            displayName: p.displayName,
            score: p.score,
            streak: p.streak
        })); // Top 5 players
        broadcastToRoom(room, {
            type: 'LEADERBOARD_UPDATE',
            payload: {
                leaderboard: sortedPlayers
            }
        });
        room.timerId = setTimeout(() => {
            runAutomatedQuiz(room, room.currentQuestionIndex + 1);
        }, 5000);
    }, 5000);
};
const broadcastToRoom = (room, messageObj) => {
    const jsonStr = JSON.stringify(messageObj);
    if (room.hostSocket && room.hostSocket.readyState === WebSocket.OPEN) {
        room.hostSocket.send(jsonStr);
    }
    for (const player of room.players.values()) {
        if (player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(jsonStr);
        }
    }
};
const finishGameAutomatically = async (room) => {
    if (room.timerId) {
        clearTimeout(room.timerId);
    }
    await prisma.liveSession.update({
        where: { id: room.sessionId },
        data: { status: 'FINISHED', endedAt: new Date() }
    });
    const sortedPlayers = Array.from(room.players.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((p, index) => ({
        rank: index + 1,
        displayName: p.displayName,
        score: p.score
    }));
    broadcastToRoom(room, {
        type: 'GAME_OVER',
        payload: {
            sortedPlayers
        }
    });
    rooms.delete(room.sessionId);
};
export { InitializeWebSocketServer };
