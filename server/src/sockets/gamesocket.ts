import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import {prisma} from "../config/client";
import { randomUUID } from 'crypto';

interface Player{
    participantId:string;
    displayName:string;
    ws:WebSocket;
    score:number;
    streak:number;
    disconnectedAt:number | null;
}
interface RoomState{
    sessionId:string;
    roomCode:string;
    quizId:string;
    hostSocket:WebSocket | null;
    players:Map<string,Player>;
    currentQuestionIndex:number;
    questionStartTime:number | null;
    activeQuestionPayload:any|null;
    isStarted:boolean;
    answersReceived:Map<string,{selectedOptionIds:string[];isCorrect:boolean; pointsAwarded:number; timeTakenMs:number}>;
    timerId:NodeJS.Timeout | null;
}
const rooms = new Map<string,RoomState>();
const calculateScore = (isCorrect:boolean, currentStreak:number, timeTakenMs:number, timeLimitSec:number, maxPoints:number=1000): {pointsAwarded:number; newStreak:number} => {
    if(!isCorrect){
        return {pointsAwarded:0,newStreak:0};
    }
    const timeLimitMs = timeLimitSec * 1000;
    const responseRatio = Math.min(Math.max(timeTakenMs / timeLimitMs, 0), 1);
    
    const basePoints = Math.round(maxPoints * (1 - responseRatio / 2));
    const newStreak = currentStreak + 1;
    const streakBonus = Math.min((newStreak - 1) * 100, 500);
    return { pointsAwarded: basePoints + streakBonus, newStreak };
}

const InitializeWebSocketServer = (httpServer: HTTPServer) => {
    const wss = new WebSocketServer({ server: httpServer,path: "/ws" });
    wss.on('connection',(ws:WebSocket)=>{
        let currentRoomCode:string|null = null;
        let participantId:string|null = null;
        let isHost = false;
        ws.on('message',async(rawMessage:Buffer|string)=>{
            try{
                const data = JSON.parse(rawMessage.toString());
                const{type,payload} = data;
                switch(type){
                    case 'JOIN_ROOM':{
                        const{roomCode,displayName,isHost:hostflag} = payload;
                        if (!roomCode) {
                            ws.send(JSON.stringify({type:'ERROR',message:'Room code is required.'}));
                            return;
                        }

                        //converting room code to uppercase and trimming whitespace to ensure consistency
                        const normalizedRoomCode = roomCode.trim().toUpperCase();
                        const session = await prisma.liveSession.findUnique({
                            where:{roomCode:normalizedRoomCode},
                            include:{quiz:true}
                        });
                        if(!session){
                            ws.send(JSON.stringify({type:'ERROR',message:'Room does not exist.'}));
                            return;
                        }
                        if(session.status === 'FINISHED'){
                            if(rooms.has(normalizedRoomCode)){
                                rooms.delete(normalizedRoomCode);
                            }
                            ws.send(JSON.stringify({type:'ERROR',message:'Session has already finished.'}));
                            return;
                        }

                        // For players: if the room is not active on the server, reject
                        if (!hostflag && !rooms.has(normalizedRoomCode)) {
                            ws.send(JSON.stringify({type:'ERROR',message:'Room does not exist or has been closed by host.'}));
                            return;
                        }

                        //check if the room already exists in the rooms map, if not create a new room state
                        if(!rooms.has(normalizedRoomCode)){
                            rooms.set(normalizedRoomCode,{
                                sessionId:session.id,
                                roomCode:normalizedRoomCode,
                                quizId:session.quizId,
                                hostSocket:null,
                                players:new Map(),
                                currentQuestionIndex:0,
                                questionStartTime:null,
                                activeQuestionPayload:null,
                                isStarted:false,
                                answersReceived:new Map(),
                                timerId:null
                            });
                        }
                        
                        const room = rooms.get(normalizedRoomCode)!;
                        currentRoomCode = normalizedRoomCode;
                        if(hostflag){
                            isHost = true;
                            room.hostSocket = ws;

                            // Always send Host_connected with full room state
                            ws.send(JSON.stringify({
                                type: 'Host_connected',
                                payLoad: {
                                    roomCode: normalizedRoomCode,
                                    quizTitle: session.quiz.title,
                                    isStarted: Boolean(room.isStarted),
                                    currentQuestionIndex: room.currentQuestionIndex,
                                    stage: room.activeQuestionPayload ? "QUESTION" : (room.isStarted ? "QUESTION" : "LOBBY")
                                }
                            }));

                            // 🔄 HOST RECONNECT: if a question is live, replay it immediately
                            if (room.activeQuestionPayload) {
                                ws.send(JSON.stringify({
                                    type: 'QUESTION_START',
                                    payload: room.activeQuestionPayload
                                }));
                            }

                            // Send current player count so the lobby list is correct
                            if (room.players.size > 0) {
                                for (const player of room.players.values()) {
                                    ws.send(JSON.stringify({
                                        type: 'PLAYER_JOINED',
                                        payload: {
                                            participantId: player.participantId,
                                            displayName: player.displayName,
                                            totalPlayers: room.players.size
                                        }
                                    }));
                                }
                            }

                            return;
                        }
                        else{
                            if(!displayName && !payload?.participantId){
                                return ws.send(JSON.stringify({type:'ERROR',message:'Display name is required for players.'}));
                            }
                        }
                        
                        const incomingParticipantId = payload?.participantId;
                        let existingPlayer = incomingParticipantId ? room.players.get(incomingParticipantId) : null;
                        if (!existingPlayer && displayName) {
                            existingPlayer = Array.from(room.players.values()).find(
                                (p) => p.displayName.trim().toLowerCase() === displayName.trim().toLowerCase()
                            );
                        }

                        if(existingPlayer){
                            // ⏱️ CHECK 2-MINUTE DISCONNECT LIMIT (120,000 ms)
                            if (existingPlayer.disconnectedAt && (Date.now() - existingPlayer.disconnectedAt > 2 * 60 * 1000)) {
                                room.players.delete(existingPlayer.participantId);
                                ws.send(JSON.stringify({
                                    type: 'SESSION_EXPIRED',
                                    message: 'You were disconnected for more than 2 minutes. Please rejoin.'
                                }));
                                return;
                            }

                            // Reconnected within 2 minutes: restore player!
                            existingPlayer.disconnectedAt = null;
                            participantId = existingPlayer.participantId;
                            existingPlayer.ws = ws;

                            ws.send(JSON.stringify({
                                type:'JOINED_ROOM',
                                payload:{
                                    roomCode:normalizedRoomCode,
                                    participantId,
                                    displayName:existingPlayer.displayName
                                }
                            }));

                            // If a question is live, send it immediately with accurate targetTime
                            if(room.activeQuestionPayload){
                                ws.send(JSON.stringify({
                                    type:'QUESTION_START',
                                    payload:room.activeQuestionPayload
                                }));
                            }

                            // If player already answered this question, restore their answer state
                            const alreadyAnswered = room.answersReceived.get(participantId);
                            if (alreadyAnswered) {
                                ws.send(JSON.stringify({
                                    type:'ANSWER_RECEIVED',
                                    payload:{
                                        isCorrect:alreadyAnswered.isCorrect,
                                        pointsAwarded:alreadyAnswered.pointsAwarded,
                                        totalScore:existingPlayer.score,
                                        streak:existingPlayer.streak
                                    }
                                }));
                            }

                            return;
                        }

                        // NEW PLAYER JOINING
                        participantId = randomUUID();
                        room.players.set(participantId, {
                            participantId,
                            displayName: displayName.trim(),
                            ws: ws,
                            score: 0,
                            streak: 0,
                            disconnectedAt: null
                        });
                        ws.send(JSON.stringify({
                            type: 'JOINED_ROOM',
                            payload: {
                                roomCode: normalizedRoomCode,
                                participantId,
                                displayName: displayName.trim()
                            }
                        }));

                        // If question is already running, send active question to new player too
                        if (room.activeQuestionPayload) {
                            ws.send(JSON.stringify({
                                type: 'QUESTION_START',
                                payload: room.activeQuestionPayload
                            }));
                        }

                        // Notify the host that a new player has joined
                        if (room.hostSocket && room.hostSocket.readyState === WebSocket.OPEN) {
                            room.hostSocket.send(JSON.stringify({
                                type: 'PLAYER_JOINED',
                                payload: {
                                    participantId,
                                    displayName: displayName.trim(),
                                    totalPlayers: room.players.size
                                }
                            }));
                        }
                        
                    }
                    break;
                    case 'START_QUIZ':{
                        if(!isHost || !currentRoomCode || !rooms.has(currentRoomCode)){
                            return;
                        }
                        const room = rooms.get(currentRoomCode)!;
                        
                        // If already started, RESUME instead of restarting from question 0!
                        if (room.isStarted) {
                            if (room.activeQuestionPayload) {
                                ws.send(JSON.stringify({
                                    type: 'QUESTION_START',
                                    payload: room.activeQuestionPayload
                                }));
                                return;
                            }
                            runAutomatedQuiz(room, room.currentQuestionIndex);
                            return;
                        }

                        room.isStarted = true;
                        await prisma.liveSession.update({
                            where:{id:room.sessionId},
                            data:{status:'QUESTION_ACTIVE', startedAt:new Date()}
                        });
                        runAutomatedQuiz(room,0);
                        break;
                    }
                    case 'END_QUIZ':{
                        if(!isHost || !currentRoomCode || !rooms.has(currentRoomCode)){
                            return;
                        }
                        const room = rooms.get(currentRoomCode)!;
                        await closeAndCleanRoom(room, 'The host has ended this game.');
                        break;
                    }
                    case 'SUBMIT_ANSWER':{
                        if(isHost|| !currentRoomCode|| !participantId || !rooms.has(currentRoomCode)){
                            return;
                        }
                        const room = rooms.get(currentRoomCode)!;
                        const player = rooms.get(currentRoomCode)!.players.get(participantId);
                        // Ensure the player exists and the question is active
                        if(!player || !room.questionStartTime){
                            return;
                        }
                        if(room.answersReceived.has(participantId)){
                            return ws.send(JSON.stringify({type:'ERROR',message:'Answer already submitted for this question.'}));
                        } 
                        const {selectedOptionIds} = payload;
                        const timeTakenMs = Date.now()-room.questionStartTime;
                        const quizQuestion = await prisma.quizQuestion.findFirst({
                            where:{quizId:room.quizId,order:room.currentQuestionIndex+ 1},
                            include:{
                                question:{
                                    include:{options:true}
                                }
                            }

                        }) 
                        if(!quizQuestion){
                            return;
                        }
                        const correctOptionIds = quizQuestion.question.options.filter(o=>o.isCorrect).map(o=>o.id);
                        const isCorrect = selectedOptionIds.length===correctOptionIds.length && selectedOptionIds.every((id:string)=>correctOptionIds.includes(id));
                        const {pointsAwarded,newStreak} = calculateScore(
                            isCorrect,
                            player.streak,
                            timeTakenMs,
                            quizQuestion.question.timeLimit,
                            quizQuestion.question.points
                        );
                        player.score+=pointsAwarded;
                        player.streak = newStreak;
                        room.answersReceived.set(participantId,{
                            selectedOptionIds,
                            isCorrect,
                            pointsAwarded,
                            timeTakenMs
                        });
                        ws.send(JSON.stringify({
                            type:'ANSWER_RECEIVED',
                            payload:{
                                isCorrect,
                                pointsAwarded,
                                totalScore:player.score,
                                streak:newStreak
                            }
                        }));
                        if(room.hostSocket && room.hostSocket.readyState === WebSocket.OPEN){
                            room.hostSocket.send(JSON.stringify({
                                type:'ANSWER_COUNT_UPDATE',
                                payload:{
                                    totalAnswers:room.answersReceived.size,
                                    totalPlayers:room.players.size
                                }
                            }));
                        }
                        if(room.answersReceived.size === room.players.size){
                            // All players have answered, proceed to next question or end quiz
                            if(room.timerId){
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
        ws.on('close',()=>{
            if(currentRoomCode && rooms.has(currentRoomCode)){
                const room = rooms.get(currentRoomCode)!;
                if(isHost){
                    room.hostSocket = null;
                } else if(participantId && room.players.has(participantId)){
                    const player = room.players.get(participantId)!;
                    player.disconnectedAt = Date.now();
                }
            }
        });
    })
}
const runAutomatedQuiz = async (room: RoomState, questionIndex: number) => {
    const question = await prisma.quizQuestion.findFirst({
        where:{quizId:room.quizId,order:questionIndex+1},
        include:{
            question:{
                include:{options:{
                    select:{id:true,text:true}
                }}
            }
        }
    })
    if(!question){
        return finishGameAutomatically(room);
    }
    room.currentQuestionIndex = questionIndex;
    room.questionStartTime = Date.now();
    room.answersReceived.clear();
    const timeLimitSec = question.question.timeLimit;
    const targetTime = Date.now() + (timeLimitSec * 1000);
    const payload = {
            questionIndex:questionIndex+1,
            text:question.question.text,
            type:question.question.type,
            timeLimit:question.question.timeLimit,
            targetTime,
            options:question.question.options
    }
    room.activeQuestionPayload = payload
    broadcastToRoom(room,{
        type:'QUESTION_START',
        payload
    });
    if(room.timerId){
        clearTimeout(room.timerId);
    }
    room.timerId = setTimeout(()=>{
        finishQuestionAndAdvance(room);
    },timeLimitSec*1000);
}

const finishQuestionAndAdvance = async (room: RoomState) => {
    if(room.timerId){
        clearTimeout(room.timerId);
    }
    const question = await prisma.quizQuestion.findFirst({
        where:{quizId:room.quizId,order:room.currentQuestionIndex+1},
        include:{
            question:{
                include:{options:true}
            }
        }
    })
    const correctOptionIds = question?.question.options.filter(o=>o.isCorrect).map(o=>o.id) || [];
    room.activeQuestionPayload = null;
    broadcastToRoom(room,{
        type:'QUESTION_RESULTS',
        payload:{
            correctOptionIds,
            totalAnswers:room.answersReceived.size,
        }
    });
    room.timerId = setTimeout(()=>{
        const sortedPlayers = Array.from(room.players.values()).sort((a,b)=>b.score-a.score)
        .slice(0,5)
        .map((p,index)=>({
            rank:index+1,
            displayName:p.displayName,
            score:p.score,
            streak:p.streak
        }))
        
        broadcastToRoom(room,{
            type:'LEADERBOARD_UPDATE',
            payload:{
                leaderboard:sortedPlayers
            }
        });
        room.timerId= setTimeout(()=>{
            runAutomatedQuiz(room,room.currentQuestionIndex+1);
        },5000)
    },5000)

}
const broadcastToRoom = (room: RoomState, messageObj:object) => {
    const jsonStr= JSON.stringify(messageObj);
    if(room.hostSocket && room.hostSocket.readyState=== WebSocket.OPEN){
        room.hostSocket.send(jsonStr);
    }
    for(const player of room.players.values()){
        if(player.ws.readyState === WebSocket.OPEN){
            player.ws.send(jsonStr);
        }
    }

}
const closeAndCleanRoom = async (room: RoomState, reason: string) => {
    if (room.timerId) {
        clearTimeout(room.timerId);
        room.timerId = null;
    }
    room.activeQuestionPayload = null;

    try {
        await prisma.liveSession.update({
            where: { id: room.sessionId },
            data: { status: 'FINISHED', endedAt: new Date() }
        });
    } catch (e) {
        console.error("Error setting session to FINISHED:", e);
    }

    broadcastToRoom(room, {
        type: 'ROOM_ENDED',
        message: reason
    });

    for (const player of room.players.values()) {
        if (player.ws.readyState === WebSocket.OPEN) {
            player.ws.close(1000, reason);
        }
    }

    if (room.hostSocket && room.hostSocket.readyState === WebSocket.OPEN) {
        room.hostSocket.close(1000, reason);
    }

    rooms.delete(room.roomCode);
};

const finishGameAutomatically = async (room: RoomState) => {
    if(room.timerId){
        clearTimeout(room.timerId);
    }
    await prisma.liveSession.update({
        where:{id:room.sessionId},
        data:{status:'FINISHED',endedAt:new Date()}
    });
    const sortedPlayers = Array.from(room.players.values())
        .sort((a, b) => b.score - a.score)
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
    rooms.delete(room.roomCode);
}

export {InitializeWebSocketServer};