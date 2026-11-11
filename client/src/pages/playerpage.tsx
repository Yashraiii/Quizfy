import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGameSocket } from "../hooks/useGameSockets";

const OPTION_LETTERS = ["A", "B", "C", "D"];

export const PlayerPage = () => {
    const { roomCode } = useParams<{ roomCode: string }>();
    const navigate = useNavigate();

    const [displayName, setDisplayName] = useState("");
    const [hasJoined, setHasJoined] = useState(false);
    const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
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
        leaderboard,
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

    // Reset selected options when a new question arrives
    useEffect(() => {
        if (stage === "QUESTION") {
            setSelectedOptionIds([]);
        }
    }, [stage]);

    // Record chosen vs correct answer for the final review screen
    useEffect(() => {
        if (stage === "QUESTION_RESULTS" && currentQuestion) {
            const chosen = currentQuestion.options.filter((o) => selectedOptionIds.includes(o.id));
            const correct = currentQuestion.options.filter((o) => correctOptionIds.includes(o.id));

            const chosenText = chosen.length > 0 ? chosen.map((c) => c.text).join(", ") : "No answer selected";
            const correctText = correct.length > 0 ? correct.map((c) => c.text).join(", ") : "None";

            const isCorrect =
                Boolean(myResult?.isCorrect) ||
                (selectedOptionIds.length > 0 &&
                    selectedOptionIds.length === correctOptionIds.length &&
                    selectedOptionIds.every((id) => correctOptionIds.includes(id)));

            setMyAnswersReview((prev) => {
                if (prev.some((item) => item.questionIndex === currentQuestion.questionIndex)) return prev;
                return [
                    ...prev,
                    {
                        questionIndex: currentQuestion.questionIndex,
                        questionText: currentQuestion.text,
                        chosenText,
                        correctText,
                        isCorrect,
                    },
                ];
            });
        }
    }, [stage, currentQuestion, selectedOptionIds, correctOptionIds, myResult]);

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!displayName.trim() || !roomCode) return;

        joinAsPlayer(roomCode, displayName.trim());
        setHasJoined(true);
    };

    const isMultiCorrect = currentQuestion?.type === "MULTI_CORRECT";

    const handlePickOption = (optionId: string) => {
        if (hasAnswered) return;

        if (isMultiCorrect) {
            // Toggle selection for multi-correct questions
            setSelectedOptionIds((prev) =>
                prev.includes(optionId)
                    ? prev.filter((id) => id !== optionId)
                    : [...prev, optionId]
            );
        } else {
            // Single choice (MCQ / TRUE_FALSE): select or switch this option
            setSelectedOptionIds([optionId]);
        }
    };

    const handleSubmitAnswer = () => {
        if (hasAnswered || selectedOptionIds.length === 0) return;
        submitAnswer(selectedOptionIds);
    };

    return (
        <div className="min-h-screen bg-transparent text-neutral-100 flex flex-col justify-between p-4 sm:p-6 select-none antialiased">
            {/* Top Bar */}
            <div className="flex justify-between items-center border-b border-white/5 pb-3.5">
                <span className="text-base font-black tracking-tight text-white">
                    Quiz<span className="text-indigo-400">fy</span>
                </span>
                <span className="text-xs font-mono text-neutral-500 border border-white/6 px-3 py-1 rounded-full">
                    PIN: {roomCode}
                </span>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="my-3 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center text-xs">
                    {error}
                </div>
            )}

            {/* ========================================================================= */}
            {/* STAGE 0: ENTER NICKNAME                                                   */}
            {/* ========================================================================= */}
            {!hasJoined && (
                <div className="flex-1 flex flex-col items-center justify-center max-w-xs mx-auto w-full py-8">
                    <div className="text-center mb-6">
                        <span className="text-xs font-mono text-neutral-600 block mb-1 uppercase tracking-wider">
                            Room · {roomCode}
                        </span>
                        <h2 className="text-xl font-bold text-white">Enter your name</h2>
                    </div>

                    <form onSubmit={handleJoin} className="w-full space-y-4">
                        <input
                            type="text"
                            required
                            maxLength={15}
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Nickname"
                            className="w-full h-11 bg-zinc-900 border border-white/8 rounded-xl text-white text-center font-bold text-base placeholder:text-neutral-600 focus:outline-none focus:border-white/20 transition"
                        />
                        <button
                            type="submit"
                            className="relative group/btn w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-sm rounded-xl border border-white/8 transition shadow-[0px_1px_0px_0px_rgba(255,255,255,0.06)_inset] cursor-pointer"
                        >
                            Join Game →
                            <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-linear-to-rrom-transparent via-neutral-500 to-transparent" />
                        </button>
                    </form>
                </div>
            )}

            {/* ========================================================================= */}
            {/* STAGE 1: LOBBY                                                            */}
            {/* ========================================================================= */}
            {hasJoined && (stage === "LOBBY" || stage === "CONNECTING") && (
                <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto py-10">
                    <div className="w-12 h-12 rounded-full border border-white/10 bg-white/3 flex items-center justify-center text-lg mb-4 animate-pulse">
                        ●
                    </div>
                    <h2 className="text-lg font-bold text-white mb-1">You're in</h2>
                    <p className="text-neutral-400 font-mono text-sm mb-4">{displayName}</p>
                    <p className="text-neutral-600 text-sm max-w-xs">
                        The host will start the quiz soon.
                    </p>
                </div>
            )}

            {/* ========================================================================= */}
            {/* STAGE 2: ACTIVE QUESTION                                                  */}
            {/* ========================================================================= */}
            {hasJoined && stage === "QUESTION" && currentQuestion && (
                <div className="flex-1 flex flex-col justify-between max-w-3xl sm:max-w-4xl mx-auto w-full py-4 sm:py-6">
                    {/* Top Status & Live Countdown Bar */}
                    <div className="text-center mb-6 space-y-2">
                        <div className="flex justify-between items-center px-1 mb-2">
                            <span className="text-xs font-mono uppercase text-neutral-500">
                                Question {currentQuestion.questionIndex} · {currentQuestion.type}
                            </span>
                            <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-lg border ${
                                timeLeft <= 5
                                    ? "border-red-500/40 text-red-400 bg-red-500/10"
                                    : "border-white/8 text-neutral-300 bg-white/2"
                            }`}>
                                {timeLeft}s remaining
                            </span>
                        </div>

                        {/* Countdown Bar */}
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

                        {/* Bigger Question Text matching Host */}
                        <h2 className="text-2xl sm:text-3xl font-bold text-white pt-2 leading-snug">
                            {currentQuestion.text}
                        </h2>
                    </div>

                    {/* Waiting or Answer Options */}
                    {hasAnswered ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                            <div className="w-12 h-12 rounded-full border border-white/10 bg-white/3 flex items-center justify-center text-base mb-3 text-white">
                                ✓
                            </div>
                            <h3 className="text-base font-bold text-white mb-1">Answer submitted</h3>
                            <p className="text-neutral-500 text-xs font-mono">Waiting for timer or others...</p>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col justify-between py-2">
                            <p className="text-xs font-mono text-neutral-400 mb-3 text-center uppercase tracking-wider">
                                {isMultiCorrect
                                    ? "Multi-Select · Select all that apply, then submit"
                                    : "Select your answer, then submit"}
                            </p>

                            {/* 4 Options Grid matching Host Page */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 flex-1 items-stretch min-h-60">
                                {currentQuestion.options.map((opt, idx) => {
                                    const isSelected = selectedOptionIds.includes(opt.id);
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => handlePickOption(opt.id)}
                                            className={`p-5 sm:p-6 rounded-2xl border flex flex-col justify-between text-left transition duration-150 cursor-pointer shadow-sm ${
                                                isSelected
                                                    ? "bg-white/12 border-white/50 ring-1 ring-white/20 shadow-md"
                                                    : "bg-white/3 border-white/8 hover:bg-white/6 hover:border-white/20"
                                            }`}
                                        >
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="font-mono text-sm font-bold text-neutral-400">
                                                    {OPTION_LETTERS[idx % 4]}
                                                </span>
                                                <span className={`w-5 h-5 ${isMultiCorrect ? "rounded-md" : "rounded-full"} border flex items-center justify-center text-xs ${
                                                    isSelected
                                                        ? "bg-white text-black border-white font-bold"
                                                        : "border-neutral-600 text-transparent"
                                                }`}>
                                                    ✓
                                                </span>
                                            </div>
                                            <span className="text-base sm:text-lg font-semibold text-neutral-100 line-clamp-3">
                                                {opt.text}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Submit button for all question types */}
                            <button
                                type="button"
                                onClick={handleSubmitAnswer}
                                disabled={selectedOptionIds.length === 0}
                                className="relative group/btn mt-5 w-full py-3.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-200 font-semibold text-sm rounded-xl border border-white/8 transition cursor-pointer shadow-[0px_1px_0px_0px_rgba(255,255,255,0.06)_inset]"
                            >
                                {isMultiCorrect
                                    ? `Submit Answer (${selectedOptionIds.length} selected) →`
                                    : "Submit Answer →"}
                                <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-linear-to-r from-transparent via-neutral-500 to-transparent" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ========================================================================= */}
            {/* STAGE 3: QUESTION RESULTS                                                 */}
            {/* ========================================================================= */}
            {hasJoined && stage === "QUESTION_RESULTS" && (
                <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto py-8">
                    {myResult ? (
                        myResult.isCorrect ? (
                            <div className="space-y-3">
                                <div className="w-12 h-12 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-lg mx-auto">
                                    ✓
                                </div>
                                <h2 className="text-lg font-bold text-white">Correct</h2>
                                <p className="text-xl font-mono text-neutral-300">
                                    +{myResult.pointsAwarded} pts
                                </p>
                                {myResult.streak > 1 && (
                                    <span className="inline-block text-[11px] font-mono text-neutral-500 border border-white/6 px-2.5 py-0.5 rounded-full">
                                        Streak: {myResult.streak}
                                    </span>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="w-12 h-12 rounded-full border border-white/10 bg-white/2 flex items-center justify-center text-lg mx-auto text-neutral-400">
                                    ✕
                                </div>
                                <h2 className="text-lg font-bold text-neutral-400">Incorrect</h2>
                                <p className="text-neutral-600 text-xs">Streak reset</p>
                            </div>
                        )
                    ) : (
                        <div className="space-y-2">
                            <h2 className="text-base font-semibold text-neutral-400">Time's Up</h2>
                            <p className="text-neutral-600 text-xs">No answer received</p>
                        </div>
                    )}

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

            {/* ========================================================================= */}
            {/* STAGE 4: LEADERBOARD VIEW                                                 */}
            {/* ========================================================================= */}
            {hasJoined && stage === "LEADERBOARD" && (
                <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full py-6">
                    <div className="text-center mb-5">
                        <span className="text-xs font-mono uppercase tracking-widest text-neutral-500">Live Standings</span>
                        <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">Scoreboard</h2>
                    </div>

                    {/* Player's personal score banner */}
                    {myResult && (
                        <div className="w-full mb-4 px-4 py-3 rounded-2xl border border-indigo-500/25 bg-indigo-500/10 flex items-center justify-between shadow-sm">
                            <div className="flex items-center space-x-2.5">
                                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                                <span className="text-xs font-semibold text-indigo-200">
                                    You ({displayName})
                                </span>
                            </div>
                            <span className="font-mono text-sm font-bold text-white">
                                {myResult.totalScore.toLocaleString()} pts
                            </span>
                        </div>
                    )}

                    {/* Leaderboard Player List matching Host Page */}
                    <div className="w-full space-y-2 mb-6">
                        {leaderboard.length > 0 ? (
                            leaderboard.map((player) => {
                                const isMe = player.displayName === displayName;
                                return (
                                    <div
                                        key={player.rank}
                                        className={`rounded-xl border p-3.5 sm:p-4 flex justify-between items-center transition ${
                                            isMe
                                                ? "bg-indigo-500/15 border-indigo-500/40 shadow-sm"
                                                : "bg-white/3 border-white/6"
                                        }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <span className={`w-6 h-6 rounded-md border flex items-center justify-center font-mono text-xs ${
                                                player.rank === 1
                                                    ? "bg-amber-400/10 border-amber-400/30 text-amber-300 font-bold"
                                                    : player.rank === 2
                                                    ? "bg-slate-300/10 border-slate-300/30 text-slate-300 font-bold"
                                                    : player.rank === 3
                                                    ? "bg-amber-700/10 border-amber-700/30 text-amber-500 font-bold"
                                                    : "bg-white/5 border-white/8 text-neutral-400"
                                            }`}>
                                                #{player.rank}
                                            </span>
                                            <div className="flex items-center space-x-2">
                                                <span className={`font-semibold text-sm ${isMe ? "text-indigo-200 font-bold" : "text-neutral-200"}`}>
                                                    {player.displayName}
                                                </span>
                                                {isMe && (
                                                    <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded">
                                                        You
                                                    </span>
                                                )}
                                                {player.streak > 1 && (
                                                    <span className="text-[10px] font-mono border border-white/8 text-neutral-400 px-2 py-0.5 rounded-full">
                                                        {player.streak} 🔥
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-sm font-mono font-bold text-neutral-100">
                                            {player.score.toLocaleString()} pts
                                        </span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-neutral-500 text-xs py-4 text-center font-mono">
                                Loading scores...
                            </div>
                        )}
                    </div>

                    {/* Loading Next Question Indicator */}
                    <div className="flex items-center justify-center gap-2 text-xs font-mono text-neutral-400">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        <span>Loading next question...</span>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* STAGE 5: GAME OVER & SUMMARY                                              */}
            {/* ========================================================================= */}
            {hasJoined && stage === "GAME_OVER" && (
                <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto py-6 w-full">
                    {(() => {
                        const myEntry = gameOverPodium.find((p) => p.displayName === displayName);
                        const myRank = myEntry?.rank || 1;
                        const myScore = myEntry?.score ?? (myResult?.totalScore ?? 0);

                        return (
                            <div className="w-full space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Quiz Over</h2>
                                    <p className="text-xs font-mono text-neutral-500 mt-1">
                                        Rank #{myRank} of {gameOverPodium.length || 1} players
                                    </p>
                                </div>

                                {/* Score Card */}
                                <div className="rounded-2xl border border-white/6 bg-white/2 p-5">
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-600 block mb-1">
                                        Final Score
                                    </span>
                                    <p className="text-3xl font-mono font-bold text-neutral-100">
                                        {myScore.toLocaleString()} pts
                                    </p>
                                </div>

                                {/* Final Standings */}
                                {gameOverPodium.length > 0 && (
                                    <div className="rounded-2xl border border-white/6 bg-white/2 p-4 text-left max-h-48 overflow-y-auto space-y-1.5">
                                        <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest block mb-2">
                                            Standings
                                        </span>
                                        {gameOverPodium.map((p) => (
                                            <div
                                                key={p.rank}
                                                className={`flex justify-between items-center px-3 py-1.5 rounded-lg text-xs font-medium ${
                                                    p.displayName === displayName
                                                        ? "bg-white/6 text-white border border-white/10"
                                                        : "text-neutral-500"
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
                                    <div className="text-left w-full space-y-2.5">
                                        <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest block">
                                            Answer Review
                                        </span>
                                        {myAnswersReview.map((item) => (
                                            <div
                                                key={item.questionIndex}
                                                className="rounded-xl border border-white/6 bg-white/2 p-3.5 space-y-1.5 text-xs"
                                            >
                                                <div className="flex justify-between items-start gap-2">
                                                    <p className="font-medium text-neutral-200 leading-snug">
                                                        Q{item.questionIndex + 1}. {item.questionText}
                                                    </p>
                                                    <span className={`shrink-0 font-bold ${
                                                        item.isCorrect ? "text-neutral-300" : "text-neutral-600"
                                                    }`}>
                                                        {item.isCorrect ? "✓" : "✕"}
                                                    </span>
                                                </div>
                                                <div className="text-neutral-500 space-y-0.5">
                                                    <p>
                                                        Your answer: <span className={item.isCorrect ? "text-neutral-300" : "text-neutral-500 line-through"}>{item.chosenText}</span>
                                                    </p>
                                                    {!item.isCorrect && (
                                                        <p className="text-neutral-400">
                                                            Correct: <span>{item.correctText}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button
                                    onClick={() => navigate("/dashboard")}
                                    className="relative group/btn w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl border border-white/8 transition cursor-pointer shadow-[0px_1px_0px_0px_rgba(255,255,255,0.06)_inset]"
                                >
                                    Back to Home
                                    <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-linear-to-r from-transparent via-neutral-500 to-transparent" />
                                </button>
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
};
