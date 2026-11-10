import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGameSocket } from "../hooks/useGameSockets";

export const PlayerPage = () => {
    const { roomCode } = useParams<{ roomCode: string }>();
    const navigate = useNavigate();

    const [displayName, setDisplayName] = useState("");
    const [hasJoined, setHasJoined] = useState(false);
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [myAnswersReview, setMyAnswersReview] = useState<{
        questionIndex: number;
        questionText: string;
        chosenText: string;
        correctText: string;
        isCorrect: boolean;
    }[]>([]);

    const {
        stage,
        currentQuestion,
        correctOptionIds,
        myResult,
        hasAnswered,
        gameOverPodium,
        error,
        joinAsPlayer,
        submitAnswer,
    } = useGameSocket();

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

    // Reset selected option when a new question arrives
    useEffect(() => {
        if (stage === "QUESTION") {
            setSelectedOptionId(null);
        }
    }, [stage]);

    // Record chosen vs correct answer for the final review screen
    useEffect(() => {
        if (stage === "QUESTION_RESULTS" && currentQuestion) {
            const chosen = currentQuestion.options.find((o) => o.id === selectedOptionId);
            const correct = currentQuestion.options.find((o) => correctOptionIds.includes(o.id));

            setMyAnswersReview((prev) => {
                if (prev.some((item) => item.questionIndex === currentQuestion.questionIndex)) return prev;
                return [
                    ...prev,
                    {
                        questionIndex: currentQuestion.questionIndex,
                        questionText: currentQuestion.text,
                        chosenText: chosen ? chosen.text : "No answer selected",
                        correctText: correct ? correct.text : "None",
                        isCorrect: Boolean(chosen && correctOptionIds.includes(chosen.id)),
                    },
                ];
            });
        }
    }, [stage, currentQuestion, selectedOptionId, correctOptionIds]);

    // Handle initial Join Form
    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!displayName.trim() || !roomCode) return;

        joinAsPlayer(roomCode, displayName.trim());
        setHasJoined(true);
    };

    // Handle picking an answer
    const handlePickOption = (optionId: string) => {
        if (hasAnswered || selectedOptionId) return;
        setSelectedOptionId(optionId);
        submitAnswer([optionId]);
    };

    const OPTION_STYLES = [
        { bg: "bg-red-600 active:bg-red-700 hover:bg-red-500", shape: "🔺", label: "Red" },
        { bg: "bg-blue-600 active:bg-blue-700 hover:bg-blue-500", shape: "🔷", label: "Blue" },
        { bg: "bg-amber-500 active:bg-amber-600 hover:bg-amber-400", shape: "🟡", label: "Yellow" },
        { bg: "bg-emerald-600 active:bg-emerald-700 hover:bg-emerald-500", shape: "🟩", label: "Green" },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 select-none">
            {/* Top Bar */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                    Quizfy Player
                </span>
                <span className="text-xs bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-slate-300 font-mono">
                    PIN: {roomCode}
                </span>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="my-3 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-center text-sm">
                    {error}
                </div>
            )}

            {/* ========================================================================= */}
            {/* STAGE 0: ENTER NICKNAME (If not joined yet)                               */}
            {/* ========================================================================= */}
            {!hasJoined && (
                <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full py-8">
                    <div className="text-center mb-6">
                        <span className="text-4xl mb-2 block">🎮</span>
                        <h2 className="text-2xl font-bold text-white">Join Game</h2>
                        <p className="text-slate-400 text-sm mt-1">Enter a nickname for the big screen</p>
                    </div>

                    <form onSubmit={handleJoin} className="w-full space-y-4">
                        <input
                            type="text"
                            required
                            maxLength={15}
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Your Nickname"
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-center font-bold text-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                            type="submit"
                            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition transform active:scale-95 cursor-pointer"
                        >
                            Enter Room →
                        </button>
                    </form>
                </div>
            )}

            {/* ========================================================================= */}
            {/* STAGE 1: LOBBY (WAITING FOR HOST TO START)                                */}
            {/* ========================================================================= */}
            {hasJoined && (stage === "LOBBY" || stage === "CONNECTING") && (
                <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto py-10">
                    <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-4xl mb-6 animate-pulse">
                        🎯
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">You're in!</h2>
                    <p className="text-indigo-400 font-bold text-lg mb-6">{displayName}</p>
                    <p className="text-slate-400 text-sm max-w-xs">
                        See your nickname on the host's screen? Hang tight, the game will start in a moment!
                    </p>
                </div>
            )}

            {/* ========================================================================= */}
            {/* STAGE 2: ACTIVE QUESTION (KAHOOT 4-COLOR BUTTONS)                         */}
            {/* ========================================================================= */}
            {hasJoined && stage === "QUESTION" && currentQuestion && (
                <div className="flex-1 flex flex-col justify-between max-w-2xl mx-auto w-full py-4">
                    {/* Top Status & Live Countdown Bar */}
                    <div className="text-center mb-3 space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-xs uppercase font-bold tracking-widest text-indigo-400">
                                Question {currentQuestion.questionIndex}
                            </span>
                            <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg border ${
                                timeLeft <= 5 ? "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse" : "bg-slate-900 text-slate-300 border-slate-700"
                            }`}>
                                ⏱️ {timeLeft}s
                            </span>
                        </div>

                        {/* Shrinking Countdown Bar */}
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-200 ${
                                    timeLeft <= 5 ? "bg-red-500" : "bg-indigo-500"
                                }`}
                                style={{
                                    width: `${currentQuestion.timeLimit ? Math.max(0, Math.min(100, (timeLeft / currentQuestion.timeLimit) * 100)) : 0}%`
                                }}
                            />
                        </div>

                        <h3 className="text-base font-bold text-white mt-1 line-clamp-2">
                            {currentQuestion.text}
                        </h3>
                    </div>

                    {/* Waiting after answering */}
                    {hasAnswered ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                            <div className="text-5xl mb-4 animate-bounce">⏳</div>
                            <h3 className="text-xl font-bold text-white mb-1">Answer Submitted!</h3>
                            <p className="text-slate-400 text-sm">Waiting for other players and timer...</p>
                        </div>
                    ) : (
                        /* 4 Big Kahoot Color Buttons */
                        <div className="grid grid-cols-2 gap-4 flex-1 items-stretch py-2 min-h-[320px]">
                            {currentQuestion.options.map((opt, idx) => {
                                const style = OPTION_STYLES[idx % 4];
                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => handlePickOption(opt.id)}
                                        className={`${style.bg} rounded-2xl flex flex-col items-center justify-center p-6 text-white transition transform active:scale-95 shadow-xl cursor-pointer`}
                                    >
                                        <span className="text-4xl sm:text-5xl mb-2">{style.shape}</span>
                                        <span className="font-bold text-sm sm:text-base text-center line-clamp-3">
                                            {opt.text}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ========================================================================= */}
            {/* STAGE 3: QUESTION RESULTS (FEEDBACK SCREEN)                               */}
            {/* ========================================================================= */}
            {hasJoined && stage === "QUESTION_RESULTS" && (
                <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto py-8">
                    {myResult ? (
                        myResult.isCorrect ? (
                            <div className="space-y-4 animate-bounce-short">
                                <span className="text-6xl">🎉</span>
                                <h2 className="text-3xl font-black text-emerald-400">Correct!</h2>
                                <p className="text-2xl font-mono font-bold text-white">
                                    +{myResult.pointsAwarded} pts
                                </p>
                                {myResult.streak > 1 && (
                                    <span className="inline-block text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full font-bold">
                                        🔥 {myResult.streak} Answer Streak!
                                    </span>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <span className="text-6xl">❌</span>
                                <h2 className="text-3xl font-black text-red-400">Incorrect!</h2>
                                <p className="text-slate-400 text-sm">Streak reset to 0</p>
                            </div>
                        )
                    ) : (
                        <div className="space-y-3">
                            <span className="text-5xl">⏰</span>
                            <h2 className="text-2xl font-bold text-amber-400">Time's Up!</h2>
                            <p className="text-slate-400 text-sm">No answer received</p>
                        </div>
                    )}
                </div>
            )}

            {/* ========================================================================= */}
            {/* STAGE 4: LEADERBOARD VIEW                                                 */}
            {/* ========================================================================= */}
            {hasJoined && stage === "LEADERBOARD" && (
                <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto py-8">
                    <span className="text-5xl mb-3">🏆</span>
                    <h2 className="text-2xl font-black text-white mb-4">Scoreboard</h2>
                    <p className="text-slate-400 text-sm mb-6">Look up at the main screen to see where you rank!</p>
                    {myResult && (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 w-full">
                            <span className="text-xs text-slate-400 uppercase font-semibold">Your Total Score</span>
                            <p className="text-3xl font-mono font-black text-indigo-400 mt-1">
                                {myResult.totalScore} pts
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* ========================================================================= */}
            {/* STAGE 5: GAME OVER / SUMMARY                                              */}
            {/* ========================================================================= */}
            {hasJoined && stage === "GAME_OVER" && (
                <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto py-6 w-full">
                    {(() => {
                        const myEntry = gameOverPodium.find((p) => p.displayName === displayName);
                        const myRank = myEntry?.rank || 1;
                        const myScore = myEntry?.score ?? (myResult?.totalScore ?? 0);

                        return (
                            <div className="w-full space-y-6">
                                {/* Trophy & Personal Rank Badge */}
                                <div>
                                    <span className="text-6xl block mb-2">
                                        {myRank === 1 ? "👑" : myRank === 2 ? "🥈" : myRank === 3 ? "🥉" : "🎯"}
                                    </span>
                                    <h2 className="text-2xl font-black text-white">Quiz Completed!</h2>
                                    <p className="text-indigo-400 font-extrabold text-lg mt-1">
                                        You placed #{myRank} of {gameOverPodium.length || 1} players!
                                    </p>
                                </div>

                                {/* Final Score Card */}
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                                    <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                                        Final Score
                                    </span>
                                    <p className="text-4xl font-mono font-black text-amber-400 mt-1">
                                        {myScore.toLocaleString()} pts
                                    </p>
                                </div>

                                {/* Final Standings List */}
                                {gameOverPodium.length > 0 && (
                                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-left max-h-48 overflow-y-auto space-y-2">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                                            Final Standings
                                        </span>
                                        {gameOverPodium.map((p) => (
                                            <div
                                                key={p.rank}
                                                className={`flex justify-between items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${
                                                    p.displayName === displayName
                                                        ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                                                        : "text-slate-300"
                                                }`}
                                            >
                                                <span>#{p.rank} {p.displayName}</span>
                                                <span className="font-mono">{p.score} pts</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Answer Review */}
                                {myAnswersReview.length > 0 && (
                                    <div className="text-left w-full space-y-3">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                                            📋 Your Answer Review
                                        </span>
                                        {myAnswersReview.map((item) => (
                                            <div
                                                key={item.questionIndex}
                                                className={`rounded-2xl border p-4 space-y-2 ${
                                                    item.isCorrect
                                                        ? "bg-emerald-900/20 border-emerald-500/30"
                                                        : "bg-red-900/20 border-red-500/30"
                                                }`}
                                            >
                                                <p className="text-sm font-bold text-white leading-snug">
                                                    Q{item.questionIndex + 1}. {item.questionText}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs font-semibold">
                                                    <span className="text-slate-400">Your answer:</span>
                                                    <span className={`px-2 py-0.5 rounded-lg ${
                                                        item.isCorrect
                                                            ? "bg-emerald-600/40 text-emerald-300"
                                                            : "bg-red-600/40 text-red-300 line-through"
                                                    }`}>
                                                        {item.chosenText}
                                                    </span>
                                                    <span className="text-slate-500">{item.isCorrect ? "✓" : "✗"}</span>
                                                </div>
                                                {!item.isCorrect && (
                                                    <div className="flex items-center gap-2 text-xs font-semibold">
                                                        <span className="text-slate-400">Correct answer:</span>
                                                        <span className="px-2 py-0.5 rounded-lg bg-emerald-600/40 text-emerald-300">
                                                            {item.correctText}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button
                                    onClick={() => navigate("/dashboard")}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition cursor-pointer"
                                >
                                    Back to Home
                                </button>
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
};