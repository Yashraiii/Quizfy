import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGameSocket } from "../hooks/useGameSockets";
import { Copy, Check } from "lucide-react";


const OPTION_LETTERS = ["A", "B", "C", "D"];

export const HostPage = () => {
    const { roomCode } = useParams<{ roomCode: string }>();
    const [copied, setCopied] = useState<boolean>(false);
    const navigate = useNavigate();

    const {
        stage,
        players,
        quizTitle,
        currentQuestion,
        answerCount,
        correctOptionIds,
        leaderboard,
        gameOverPodium,
        error,
        joinAsHost,
        startQuiz,
    } = useGameSocket();

    const [timeLeft, setTimeLeft] = useState<number>(0);

    // Live Synchronized Countdown Timer
    useEffect(() => {
        if (stage !== "QUESTION" || !currentQuestion) return;

        const updateTimer = () => {
            const remaining = Math.max(0, Math.ceil((currentQuestion.targetTime - Date.now()) / 1000));
            setTimeLeft(remaining);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 200);
        return () => clearInterval(interval);
    }, [stage, currentQuestion]);

    useEffect(() => {
        if (roomCode) {
            joinAsHost(roomCode);
        }
    }, [roomCode, joinAsHost]);
    const handleCopy = async () => {
        if (!roomCode) return;
        try {
            await navigator.clipboard.writeText(roomCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    };

    return (
        <div className="min-h-screen bg-transparent text-neutral-100 flex flex-col justify-between p-6 select-none antialiased">
            {/* Top Bar */}
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div className="flex items-center space-x-3">
                    <span className="text-lg font-black tracking-tight text-white">
                        Quiz<span className="text-indigo-400">fy</span>
                    </span>
                    {quizTitle && (
                        <span className="text-sm bg-white/3 border border-white/6 px-3 py-1 rounded-full text-neutral-400 font-medium">
                            {quizTitle}
                        </span>
                    )}
                </div>

                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate("/dashboard")}
                       className="relative group/btn text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-white hover:text-black border border-white/8 rounded-lg px-3 py-1.5 transition duration-200 disabled:opacity-50 cursor-pointer shadow-[0px_1px_0px_0px_rgba(255,255,255,0.06)_inset]"
                    >
                        End game
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="my-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center text-xs">
                    {error}
                </div>
            )}

            {/* STAGE 1: LOBBY */}
            {(stage === "LOBBY" || stage === "CONNECTING") && (
                <div className="flex-1 flex flex-col items-center justify-center text-center max-w-3xl mx-auto py-10 w-full">

                    <div className="rounded-3xl border border-white/8 bg-white/2 px-10 py-5 mb-10 shadow-2xl">
                        <div>
                            <p className="text-3xl sm:text-3xl font-light italic mb-2 text-neutral-300">
                                Room Code
                            </p>
                            <div className="flex items-center justify-center gap-4">
                                <span className="text-5xl sm:text-5xl font-black font-mono tracking-widest text-neutral-100">
                                    {roomCode}
                                </span>
                                
                                <button
                                    onClick={handleCopy}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 transition-all duration-200 cursor-pointer"
                                    title="Copy Room Code"
                                >
                                    {copied ? (
                                        <Check className="w-5 h-5 text-green-400" />
                                    ) : (
                                        <Copy className="w-5 h-5 text-neutral-300 hover:text-white" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Players Count & Start Button */}
                    <div className="w-full flex justify-between items-center mb-6 px-2">
                        <div className="flex items-center space-x-2 text-neutral-400 text-sm font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-400/80 animate-pulse" />
                            <span>{players.length} {players.length === 1 ? "player" : "players"} connected</span>
                        </div>

                        <button
                            onClick={startQuiz}
                            disabled={players.length === 0}
                            className="relative group/btn px-8 py-3 bg-neutral-800  disabled:opacity-40 text-neutral-200 hover:bg-white hover:text-black font-semibold text-sm rounded-xl border border-white/8 shadow-[0px_1px_0px_0px_rgba(255,255,255,0.06)_inset] transition cursor-pointer"
                        >
                            Start Game →
                            <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-linear-to-r from-transparent via-neutral-500 to-transparent" />
                        </button>
                    </div>

                    {/* Player Badges */}
                    <div className="w-full min-h-36 rounded-2xl border border-white/5 bg-white/1 p-6 flex flex-wrap gap-2.5 items-center justify-center">
                        {players.length === 0 ? (
                            <p className=   " text-amber-50 italic">Waiting for players to Join...</p>
                        ) : (
                            players.map((p) => (
                                <div
                                    key={p.participantId}
                                    className="px-4 py-2 bg-white/4 border border-white/8 rounded-xl text-neutral-200 font-medium text-xs shadow-sm"
                                >
                                    {p.displayName}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* STAGE 2: QUESTION */}
            {stage === "QUESTION" && currentQuestion && (
                <div className="flex-1 flex flex-col justify-between max-w-4xl mx-auto w-full py-6">
                    {/* Question Statement Card */}
                    <div className="rounded-3xl border border-white/8 bg-white/2 p-8 text-center mb-6">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="text-xs font-mono uppercase tracking-widest text-neutral-500">
                                Question {currentQuestion.questionIndex}
                            </span>
                            {currentQuestion.type === "MULTI_CORRECT" && (
                                <span className="text-[10px] font-mono text-neutral-400 border border-white/8 bg-white/3 px-2 py-0.5 rounded-full uppercase">
                                    Multi-Select
                                </span>
                            )}
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white">
                            {currentQuestion.text}
                        </h2>
                    </div>

                    {/* Timer & Live Answer Counter */}
                    <div className="space-y-2 mb-4 px-2">
                        <div className="flex justify-between items-center text-xs font-medium text-neutral-400">
                            <span className={`font-mono px-3 py-1 rounded-lg border ${
                                timeLeft <= 5
                                    ? "bg-red-500/10 border-red-500/30 text-red-400"
                                    : "bg-white/3 border-white/8 text-neutral-300"
                            }`}>
                                {timeLeft}s remaining
                            </span>
                            <span>
                                Answers: <strong className="text-neutral-200">{answerCount.answered}</strong> / {answerCount.total || players.length}
                            </span>
                        </div>

                        {/* Animated Countdown Bar */}
                        <div className="w-full h-1 bg-white/6 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-200 ${
                                    timeLeft <= 5 ? "bg-red-400" : "bg-neutral-300"
                                }`}
                                style={{
                                    width: `${currentQuestion.timeLimit ? Math.max(0, Math.min(100, (timeLeft / currentQuestion.timeLimit) * 100)) : 0}%`
                                }}
                            />
                        </div>
                    </div>

                    {/* 4 Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {currentQuestion.options.map((opt, idx) => (
                            <div
                                key={opt.id}
                                className="p-6 rounded-2xl border border-white/8 bg-white/3 text-white flex items-center space-x-4 shadow-sm"
                            >
                                <span className="font-mono text-sm font-bold text-neutral-500">{OPTION_LETTERS[idx % 4]}</span>
                                <span className="text-base font-semibold text-neutral-200">{opt.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* STAGE 3: QUESTION RESULTS */}
            {stage === "QUESTION_RESULTS" && currentQuestion && (
                <div className="flex-1 flex flex-col justify-center items-center max-w-3xl mx-auto w-full py-8 text-center">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-6">Correct Answer</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                        {currentQuestion.options.map((opt, idx) => {
                            const isCorrect = correctOptionIds.includes(opt.id);
                            return (
                                <div
                                    key={opt.id}
                                    className={`p-5 rounded-2xl border flex items-center justify-between text-sm font-semibold transition ${
                                        isCorrect
                                            ? "bg-white/8 border-white/40 text-white shadow-md"
                                            : "bg-white/1 border-white/4 text-neutral-600 opacity-40"
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <span className="font-mono text-xs">{OPTION_LETTERS[idx % 4]}</span>
                                        <span>{opt.text}</span>
                                    </div>
                                    {isCorrect && <span className="font-bold text-white">✓</span>}
                                </div>
                            );
                        })}
                    </div>
                    <p className="text-neutral-500 text-xs font-mono mt-8">Scoreboard in 5 seconds...</p>
                </div>
            )}

            {/* STAGE 4: LEADERBOARD SCREEN */}
            {stage === "LEADERBOARD" && (
                <div className="flex-1 flex flex-col justify-center items-center max-w-xl mx-auto w-full py-8">
                    <h2 className="text-lg font-bold text-white mb-6">Scoreboard</h2>
                    <div className="w-full space-y-2">
                        {leaderboard.map((player) => (
                            <div
                                key={player.rank}
                                className="rounded-xl border border-white/6 bg-white/2 p-4 flex justify-between items-center"
                            >
                                <div className="flex items-center space-x-3">
                                    <span className="w-6 h-6 rounded-md bg-white/5 border border-white/8 flex items-center justify-center font-mono text-xs text-neutral-400">
                                        #{player.rank}
                                    </span>
                                    <span className="font-medium text-neutral-200 text-sm">{player.displayName}</span>
                                    {player.streak > 1 && (
                                        <span className="text-[10px] font-mono border border-white/8 text-neutral-400 px-2 py-0.5 rounded-full">
                                            {player.streak} streak
                                        </span>
                                    )}
                                </div>
                                <span className="text-sm font-mono font-bold text-neutral-200">{player.score.toLocaleString()} pts</span>
                            </div>
                        ))}
                    </div>
                    {/* Loading Next Question Indicator */}
                    <div className="mt-8 flex items-center justify-center gap-2 text-xs font-mono text-neutral-400">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        <span>Loading next question...</span>
                    </div>
                </div>
            )}

            {/* STAGE 5: GAME OVER */}
            {stage === "GAME_OVER" && (
                <div className="flex-1 flex flex-col justify-center items-center max-w-2xl mx-auto w-full py-8 text-center">
                    <h2 className="text-3xl font-black text-white mb-8">
                        Game Over
                    </h2>

                    {/* Podium */}
                    <div className="flex justify-center items-end gap-3 w-full mb-8 max-w-md">
                        {/* 2nd Place */}
                        {gameOverPodium[1] && (
                            <div className="flex-1 rounded-2xl border border-white/8 bg-white/2 p-4 h-44 flex flex-col justify-end items-center">
                                <span className="text-xs font-mono text-neutral-500 mb-1">#2</span>
                                <span className="font-bold text-white text-sm">{gameOverPodium[1].displayName}</span>
                                <span className="text-xs font-mono text-neutral-400 mt-1">{gameOverPodium[1].score.toLocaleString()} pts</span>
                            </div>
                        )}
                        {/* 1st Place */}
                        {gameOverPodium[0] && (
                            <div className="flex-1 rounded-2xl border border-white/20 bg-white/6 p-5 h-56 flex flex-col justify-end items-center shadow-lg">
                                <span className="text-xs font-mono text-neutral-300 font-bold mb-1">👑 1st</span>
                                <span className="text-base font-bold text-white">{gameOverPodium[0].displayName}</span>
                                <span className="text-xs font-mono text-neutral-300 font-semibold mt-1">{gameOverPodium[0].score.toLocaleString()} pts</span>
                            </div>
                        )}
                        {/* 3rd Place */}
                        {gameOverPodium[2] && (
                            <div className="flex-1 rounded-2xl border border-white/8 bg-white/2 p-4 h-36 flex flex-col justify-end items-center">
                                <span className="text-xs font-mono text-neutral-500 mb-1">#3</span>
                                <span className="font-bold text-white text-sm">{gameOverPodium[2].displayName}</span>
                                <span className="text-xs font-mono text-neutral-400 mt-1">{gameOverPodium[2].score.toLocaleString()} pts</span>
                            </div>
                        )}
                    </div>

                    {/* All Player Standings */}
                    {gameOverPodium.length > 0 && (
                        <div className="w-full max-w-md rounded-2xl border border-white/6 bg-white/2 p-4 mb-8 text-left">
                            <h4 className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-3">
                                Final Standings ({gameOverPodium.length} Total)
                            </h4>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                {gameOverPodium.map((p) => (
                                    <div
                                        key={p.rank}
                                        className="flex justify-between items-center px-3.5 py-1.5 bg-white/2 border border-white/5 rounded-lg text-xs font-medium"
                                    >
                                        <div className="flex items-center space-x-2.5">
                                            <span className="text-neutral-500 font-mono w-5">#{p.rank}</span>
                                            <span className="text-neutral-200">{p.displayName}</span>
                                        </div>
                                        <span className="font-mono text-neutral-300">{p.score.toLocaleString()} pts</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => navigate("/dashboard")}
                        className="relative group/btn px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl border border-white/8 transition cursor-pointer shadow-[0px_1px_0px_0px_rgba(255,255,255,0.06)_inset]"
                    >
                        Back to Dashboard
                        <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-linear-to-r from-transparent via-neutral-500 to-transparent" />
                    </button>
                </div>
            )}
        </div>
    );
};
