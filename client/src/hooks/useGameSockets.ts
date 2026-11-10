import { useState, useEffect, useRef, useCallback } from "react";

// Types matching your backend gamesocket.ts
export interface Player {
    participantId: string;
    displayName: string;
}

export interface QuestionData {
    questionIndex: number;
    text: string;
    type: string;
    timeLimit: number;
    targetTime: number;
    options: { id: string; text: string }[];
}

export interface LeaderboardEntry {
    rank: number;
    displayName: string;
    score: number;
    streak: number;
}

export interface AnswerResult {
    isCorrect: boolean;
    pointsAwarded: number;
    totalScore: number;
    streak: number;
}

export type GameStage = 
    | "CONNECTING"
    | "LOBBY"
    | "QUESTION"
    | "QUESTION_RESULTS"
    | "LEADERBOARD"
    | "GAME_OVER";

export const useGameSocket = () => {
    const wsRef = useRef<WebSocket | null>(null);

    // Game state
    const [stage, setStage] = useState<GameStage>("CONNECTING");
    const [players, setPlayers] = useState<Player[]>([]);
    const [quizTitle, setQuizTitle] = useState("");
    const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
    const [answerCount, setAnswerCount] = useState({ answered: 0, total: 0 });
    const [correctOptionIds, setCorrectOptionIds] = useState<string[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [gameOverPodium, setGameOverPodium] = useState<any[]>([]);
    const [myResult, setMyResult] = useState<AnswerResult | null>(null);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Connect to WebSocket server on mount
    useEffect(() => {
        const socket = new WebSocket("ws://localhost:3000/ws");
        wsRef.current = socket;

        socket.onopen = () => {
            console.log("Connected to Quizfy WebSocket server");
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                const { type, payload, payLoad } = data;
                const messagePayload = payload || payLoad; // handling casing differences

                switch (type) {
                    // Host connected to room
                    case "Host_connected":
                    case "HOST_CONNECTED":
                        setQuizTitle(messagePayload?.quizTitle || "");
                        setStage("LOBBY");
                        break;

                    // Player joined (Host receives this)
                    case "PLAYER_JOINED":
                        setPlayers((prev) => {
                            const exists = prev.some((p) => p.participantId === messagePayload.participantId);
                            if (exists) return prev;
                            return [...prev, {
                                participantId: messagePayload.participantId,
                                displayName: messagePayload.displayName,
                            }];
                        });
                        break;

                    // Player self joined room
                    case "JOINED_ROOM":
                        setStage("LOBBY");
                        break;

                    // New Question starts
                    case "QUESTION_START":
                        setCurrentQuestion(messagePayload);
                        setCorrectOptionIds([]);
                        setMyResult(null);
                        setHasAnswered(false);
                        setStage("QUESTION");
                        break;

                    // Host live counter of how many players answered
                    case "ANSWER_COUNT_UPDATE":
                        setAnswerCount({
                            answered: messagePayload.totalAnswers,
                            total: messagePayload.totalPlayers,
                        });
                        break;

                    // Player gets individual feedback for their answer
                    case "ANSWER_RECEIVED":
                        setMyResult(messagePayload);
                        setHasAnswered(true);
                        break;

                    // Question ends, correct answer revealed
                    case "QUESTION_RESULTS":
                        setCorrectOptionIds(messagePayload.correctOptionIds || []);
                        setStage("QUESTION_RESULTS");
                        break;

                    // Scoreboard update
                    case "LEADERBOARD_UPDATE":
                        setLeaderboard(messagePayload.leaderboard || []);
                        setStage("LEADERBOARD");
                        break;

                    // End of quiz
                    case "GAME_OVER":
                        setGameOverPodium(messagePayload.sortedPlayers || []);
                        setStage("GAME_OVER");
                        break;

                    case "ERROR":
                        setError(data.message || "An error occurred");
                        break;
                }
            } catch (err) {
                console.error("Failed to parse WS message", err);
            }
        };

        socket.onerror = (err) => {
            console.error("WebSocket error:", err);
            setError("WebSocket connection error");
        };

        socket.onclose = () => {
            console.log("Disconnected from Quizfy WebSocket server");
        };

        return () => {
            socket.close();
        };
    }, []);

    // 1. Join room as Host
    const joinAsHost = useCallback((roomCode: string) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: "JOIN_ROOM",
                payload: {
                    roomCode,
                    isHost: true,
                },
            }));
        } else {
            // If socket not open yet, wait 200ms
            setTimeout(() => joinAsHost(roomCode), 200);
        }
    }, []);

    // 2. Join room as Player
    const joinAsPlayer = useCallback((roomCode: string, displayName: string) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: "JOIN_ROOM",
                payload: {
                    roomCode,
                    displayName,
                    isHost: false,
                },
            }));
        } else {
            setTimeout(() => joinAsPlayer(roomCode, displayName), 200);
        }
    }, []);

    // 3. Host starts quiz
    const startQuiz = useCallback(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: "START_QUIZ",
                payload: {},
            }));
        }
    }, []);

    // 4. Player submits answer
    const submitAnswer = useCallback((selectedOptionIds: string[]) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: "SUBMIT_ANSWER",
                payload: {
                    selectedOptionIds,
                },
            }));
            setHasAnswered(true);
        }
    }, []);

    return {
        stage,
        players,
        quizTitle,
        currentQuestion,
        answerCount,
        correctOptionIds,
        leaderboard,
        gameOverPodium,
        myResult,
        hasAnswered,
        error,
        joinAsHost,
        joinAsPlayer,
        startQuiz,
        submitAnswer,
    };
};