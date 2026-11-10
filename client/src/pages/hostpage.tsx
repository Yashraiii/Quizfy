import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGameSocket } from "../hooks/useGameSockets";

export const HostPage = () => {
    const { roomCode } = useParams<{ roomCode: string }>();
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

    // Connect to room as host on mount
    useEffect(() => {
        if (roomCode) {
            joinAsHost(roomCode);
        }
    }, [roomCode, joinAsHost]);

    // Kahoot color palette
    const OPTION_COLORS = [
        "bg-red-600 border-red-500",
        "bg-blue-600 border-blue-500",
        "bg-amber-500 border-amber-400",
        "bg-emerald-600 border-emerald-500",
    ];

    const OPTION_SHAPES = ["🔺", "🔷", "🟡", "🟩"];

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 select-none">
            {/* Top Bar */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                    <span className="text-xl font-black text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-purple-400">
                        Quizfy Live
                    </span>
                    {quizTitle && (
                        <span className="text-xs bg-slate-800 px-3 py-1 rounded-full text-slate-300 font-medium">
                            {quizTitle}
                        </span>
                    )}
                </div>

                <div className="flex items-center space-x-4">
                    <span className="text-sm font-semibold text-slate-400">
                        PIN: <span className="text-indigo-400 text-lg font-mono tracking-wider font-bold">{roomCode}</span>
                    </span>
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="text-xs text-red-400 hover:text-red-300 transition cursor-pointer"
                    >
                        End Game
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="my-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-center text-sm">
                    {error}
                </div>
            )}

            
            {(stage === "LOBBY" || stage === "CONNECTING") && (
                <div className="flex-1 flex flex-col items-center justify-center text-center max-w-4xl mx-auto py-10">
                    <p className="text-slate-400 text-sm uppercase font-bold tracking-widest mb-2">
                        Join at <span className="text-white font-mono">quizfy.com/play</span>
                    </p>

                    {/* Big Game PIN */}
                    <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-3xl px-12 py-6 mb-10 shadow-2xl shadow-indigo-500/10">
                        <span className="text-6xl sm:text-7xl font-black font-mono tracking-widest text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-purple-400">
                            {roomCode}
                        </span>
                    </div>

                    {/* Players Count & Start Button */}
                    <div className="w-full flex justify-between items-center mb-6 px-4">
                        <div className="flex items-center space-x-2 text-slate-300 font-semibold">
                            <span className="text-xl">👥</span>
                            <span>{players.length} Players Joined</span>
                        </div>

                        <button
                            onClick={startQuiz}
                            disabled={players.length === 0}
                            className="px-8 py-3.5 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white font-bold text-lg rounded-2xl shadow-xl shadow-indigo-600/30 transition transform active:scale-95 cursor-pointer"
                        >
                            Start Game →
                        </button>
                    </div>

                    {/* Player Name Badges Grid */}
                    <div className="w-full min-h-40 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-wrap gap-3 items-center justify-center">
                        {players.length === 0 ? (
                            <p className="text-slate-500 italic">Waiting for players to join with the PIN...</p>
                        ) : (
                            players.map((p) => (
                                <div
                                    key={p.participantId}
                                    className="px-5 py-2.5 bg-slate-800 border border-slate-700/80 rounded-xl text-white font-bold text-sm shadow-md animate-bounce-short"
                                >
                                    {p.displayName}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {stage === "QUESTION" && currentQuestion && (
                <div className="flex-1 flex flex-col justify-between max-w-5xl mx-auto w-full py-6">
                    {/* Question Statement */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-xl mb-6">
                        <span className="text-xs uppercase font-bold tracking-widest text-indigo-400 mb-2 block">
                            Question {currentQuestion.questionIndex}
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black text-white">
                            {currentQuestion.text}
                        </h2>
                    </div>

                    {/* Timer & Live Answer Counter */}
                    <div className="space-y-2 mb-4 px-2">
                        <div className="flex justify-between items-center text-slate-300 font-semibold">
                            <div className="flex items-center space-x-2">
                                <span className={`text-xl font-mono font-bold px-3 py-1 rounded-xl border ${
                                    timeLeft <= 5 
                                        ? "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse" 
                                        : "bg-slate-800 text-indigo-300 border-slate-700"
                                }`}>
                                    ⏱️ {timeLeft}s
                                </span>
                            </div>
                            <div className="flex items-center space-x-2 text-indigo-400">
                                <span>Answers:</span>
                                <span className="text-white text-lg font-bold">
                                    {answerCount.answered} / {answerCount.total || players.length}
                                </span>
                            </div>
                        </div>

                        {/* Animated Shrinking Kahoot Countdown Bar */}
                        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-200 ${
                                    timeLeft <= 5 ? "bg-red-500" : "bg-gradient-to-r from-indigo-500 to-purple-500"
                                }`}
                                style={{
                                    width: `${currentQuestion.timeLimit ? Math.max(0, Math.min(100, (timeLeft / currentQuestion.timeLimit) * 100)) : 0}%`
                                }}
                            />
                        </div>
                    </div>

                    {/* 4 Colored Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {currentQuestion.options.map((opt, idx) => (
                            <div
                                key={opt.id}
                                className={`p-6 rounded-2xl border-2 ${OPTION_COLORS[idx % 4]} text-white flex items-center space-x-4 shadow-lg`}
                            >
                                <span className="text-2xl">{OPTION_SHAPES[idx % 4]}</span>
                                <span className="text-xl font-bold">{opt.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            
            {stage === "QUESTION_RESULTS" && currentQuestion && (
                <div className="flex-1 flex flex-col justify-center items-center max-w-4xl mx-auto w-full py-8 text-center">
                    <h3 className="text-2xl font-bold text-slate-300 mb-6">Correct Answer</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                        {currentQuestion.options.map((opt, idx) => {
                            const isCorrect = correctOptionIds.includes(opt.id);
                            return (
                                <div
                                    key={opt.id}
                                    className={`p-6 rounded-2xl border-2 flex items-center justify-between text-white font-bold text-lg transition ${
                                        isCorrect
                                            ? "bg-emerald-600 border-emerald-400 shadow-xl shadow-emerald-500/20 scale-102"
                                            : "bg-slate-900 border-slate-800 opacity-30"
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <span>{OPTION_SHAPES[idx % 4]}</span>
                                        <span>{opt.text}</span>
                                    </div>
                                    {isCorrect && <span className="text-2xl">✓</span>}
                                </div>
                            );
                        })}
                    </div>
                    <p className="text-slate-400 text-sm mt-8 animate-pulse">Leaderboard coming up in 5 seconds...</p>
                </div>
            )}

            {/* ========================================================================= */}
            {/* STAGE 4: LEADERBOARD SCREEN                                               */}
            {/* ========================================================================= */}
            {stage === "LEADERBOARD" && (
                <div className="flex-1 flex flex-col justify-center items-center max-w-2xl mx-auto w-full py-8">
                    <h2 className="text-3xl font-black text-white mb-6">🏆 Scoreboard</h2>
                    <div className="w-full space-y-3">
                        {leaderboard.map((player) => (
                            <div
                                key={player.rank}
                                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex justify-between items-center shadow-lg"
                            >
                                <div className="flex items-center space-x-4">
                                    <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-indigo-400">
                                        #{player.rank}
                                    </span>
                                    <span className="font-bold text-white text-lg">{player.displayName}</span>
                                    {player.streak > 1 && (
                                        <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">
                                            🔥 {player.streak} streak
                                        </span>
                                    )}
                                </div>
                                <span className="text-xl font-mono font-bold text-white">{player.score} pts</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-slate-400 text-sm mt-8 animate-pulse">Next question starting automatically...</p>
                </div>
            )}

            {/* ========================================================================= */}
            {/* STAGE 5: GAME OVER / PODIUM                                               */}
            {/* ========================================================================= */}
            {stage === "GAME_OVER" && (
                <div className="flex-1 flex flex-col justify-center items-center max-w-3xl mx-auto w-full py-8 text-center">
                    <span className="text-6xl mb-4">🎉</span>
                    <h2 className="text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-amber-300 via-yellow-400 to-amber-500 mb-8">
                        Game Over!
                    </h2>

                    {/* Podium */}
                    <div className="flex justify-center items-end gap-4 w-full mb-8">
                        {/* 2nd Place */}
                        {gameOverPodium[1] && (
                            <div className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl p-4 h-48 flex flex-col justify-end items-center">
                                <span className="text-3xl mb-1">🥈</span>
                                <span className="font-bold text-white">{gameOverPodium[1].displayName}</span>
                                <span className="text-sm text-slate-400">{gameOverPodium[1].score} pts</span>
                            </div>
                        )}
                        {/* 1st Place */}
                        {gameOverPodium[0] && (
                            <div className="flex-1 bg-linear-to-t from-amber-600/30 to-amber-500/10 border-2 border-amber-400 rounded-2xl p-6 h-64 flex flex-col justify-end items-center shadow-xl shadow-amber-500/10">
                                <span className="text-5xl mb-2">👑</span>
                                <span className="text-xl font-black text-white">{gameOverPodium[0].displayName}</span>
                                <span className="text-sm font-bold text-amber-300">{gameOverPodium[0].score} pts</span>
                            </div>
                        )}
                        {/* 3rd Place */}
                        {gameOverPodium[2] && (
                            <div className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl p-4 h-40 flex flex-col justify-end items-center">
                                <span className="text-3xl mb-1">🥉</span>
                                <span className="font-bold text-white">{gameOverPodium[2].displayName}</span>
                                <span className="text-sm text-slate-400">{gameOverPodium[2].score} pts</span>
                            </div>
                        )}
                    </div>

                    {/* All Player Standings Summary */}
                    {gameOverPodium.length > 0 && (
                        <div className="w-full max-w-xl bg-slate-900/80 border border-slate-800 rounded-2xl p-5 mb-8 text-left shadow-xl">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                Complete Final Standings ({gameOverPodium.length} Total)
                            </h4>
                            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                {gameOverPodium.map((p) => (
                                    <div
                                        key={p.rank}
                                        className="flex justify-between items-center px-4 py-2 bg-slate-800/60 border border-slate-700/40 rounded-xl text-sm font-semibold"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <span className="text-indigo-400 font-bold w-6">#{p.rank}</span>
                                            <span className="text-white">{p.displayName}</span>
                                        </div>
                                        <span className="font-mono text-amber-400 font-bold">{p.score.toLocaleString()} pts</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => navigate("/dashboard")}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition cursor-pointer"
                    >
                        Back to Dashboard
                    </button>
                </div>
            )}
        </div>
    );
};