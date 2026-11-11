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
    const [showSummary, setShowSummary] = useState(false);
    const [myAnswersReview, setMyAnswersReview] = useState<{
        questionIndex: number;
        questionText: string;
        options: { id: string; text: string }[];
        selectedOptionIds: string[];
        correctOptionIds: string[];
        isCorrect: boolean;
        pointsAwarded: number;
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
        myParticipantId,
        joinAsPlayer,
        submitAnswer,
    } = useGameSocket();

    const SESSION_KEY = `quizfy_player_${roomCode?.toUpperCase()}`;

    // Auto-reconnect if session exists and user was away <= 2 minutes
    useEffect(() => {
        if (!roomCode) return;
        try {
            const raw = sessionStorage.getItem(SESSION_KEY);
            if (raw) {
                const saved = JSON.parse(raw);
                const lastSeen = saved.lastActive || saved.joinedAt || Date.now();
                const diffMs = Date.now() - lastSeen;

                if (diffMs <= 2 * 60 * 1000) {
                    // Reconnect within 2 minutes!
                    setDisplayName(saved.displayName);
                    setHasJoined(true);
                    joinAsPlayer(roomCode, saved.displayName, saved.participantId);
                } else {
                    // Off for more than 2 minutes: clear session and ask to rejoin
                    sessionStorage.removeItem(SESSION_KEY);
                }
            }
        } catch (e) {
            console.error("Failed to restore player session", e);
        }
    }, [roomCode, joinAsPlayer, SESSION_KEY]);

    // Keep session updated with participantId from server
    useEffect(() => {
        if (myParticipantId && displayName && roomCode) {
            sessionStorage.setItem(
                SESSION_KEY,
                JSON.stringify({
                    roomCode: roomCode.toUpperCase(),
                    displayName,
                    participantId: myParticipantId,
                    lastActive: Date.now(),
                })
            );
        }
    }, [myParticipantId, displayName, roomCode, SESSION_KEY]);

    // Update lastActive timestamp every 10s while joined
    useEffect(() => {
        if (!hasJoined) return;
        const interval = setInterval(() => {
            const raw = sessionStorage.getItem(SESSION_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                parsed.lastActive = Date.now();
                sessionStorage.setItem(SESSION_KEY, JSON.stringify(parsed));
            }
        }, 10000);
        return () => clearInterval(interval);
    }, [hasJoined, SESSION_KEY]);

    // Clear session when room is closed or ended
    useEffect(() => {
        if (stage === "ROOM_ENDED") {
            sessionStorage.removeItem(SESSION_KEY);
            setHasJoined(false);
        }
    }, [stage, SESSION_KEY]);

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
            const isCorrect =
                Boolean(myResult?.isCorrect) ||
                (selectedOptionIds.length > 0 &&
                    selectedOptionIds.length === correctOptionIds.length &&
                    selectedOptionIds.every((id) => correctOptionIds.includes(id)));

            const points = myResult?.pointsAwarded ?? 0;

            setMyAnswersReview((prev) => {
                if (prev.some((item) => item.questionIndex === currentQuestion.questionIndex)) return prev;
                return [
                    ...prev,
                    {
                        questionIndex: currentQuestion.questionIndex,
                        questionText: currentQuestion.text,
                        options: currentQuestion.options,
                        selectedOptionIds: [...selectedOptionIds],
                        correctOptionIds: [...correctOptionIds],
                        isCorrect,
                        pointsAwarded: points,
                    },
                ];
            });
        }
    }, [stage, currentQuestion, selectedOptionIds, correctOptionIds, myResult]);

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!displayName.trim() || !roomCode) return;

        sessionStorage.setItem(
            SESSION_KEY,
            JSON.stringify({
                roomCode: roomCode.toUpperCase(),
                displayName: displayName.trim(),
                joinedAt: Date.now(),
                lastActive: Date.now(),
            })
        );
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

            
            {/* ROOM ENDED VIEW */}
            {stage === "ROOM_ENDED" && (
                <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto py-12">
                    <div className="w-12 h-12 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 flex items-center justify-center text-xl mb-4">
                        ✕
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Game Ended</h2>
                    <p className="text-xs text-neutral-400 mb-6">
                        The host has closed this room or the session has ended.
                    </p>
                    <button
                        onClick={() => navigate("/")}
                        className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl border border-white/8 transition cursor-pointer"
                    >
                        Back to Home
                    </button>
                </div>
            )}

            {stage !== "ROOM_ENDED" && !hasJoined && (
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

           
            {hasJoined && stage === "GAME_OVER" && (
                <div className="flex-1 flex flex-col items-center justify-center max-w-sm sm:max-w-2xl mx-auto py-6 w-full">
                    {(() => {
                        const myEntry = gameOverPodium.find((p) => p.displayName === displayName);
                        const myRank = myEntry?.rank || 1;
                        const myScore = myEntry?.score ?? (myResult?.totalScore ?? 0);
                        const correctCount = myAnswersReview.filter((a) => a.isCorrect).length;

                        if (showSummary) {
                            return (
                                <div className="w-full space-y-6">
                                    {/* Top Navigation & Stats */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/6 pb-4">
                                        <div>
                                            <h2 className="text-xl font-bold text-white">Quiz Summary</h2>
                                            <p className="text-xs font-mono text-neutral-400 mt-0.5">
                                                {correctCount} of {myAnswersReview.length} questions correct · {myScore.toLocaleString()} pts
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowSummary(false)}
                                            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-medium text-neutral-200 transition cursor-pointer"
                                        >
                                            ← Back to Results
                                        </button>
                                    </div>

                                    {/* Questions & Options Breakdown */}
                                    <div className="space-y-5">
                                        {myAnswersReview.map((item, qIdx) => (
                                            <div
                                                key={item.questionIndex}
                                                className="rounded-2xl border border-white/8 bg-white/2 p-5 text-left space-y-3"
                                            >
                                                {/* Question Header */}
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                                                        Question {qIdx + 1}
                                                    </span>
                                                    <span className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full border ${
                                                        item.isCorrect
                                                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                                            : "bg-red-500/10 border-red-500/30 text-red-400"
                                                    }`}>
                                                        {item.isCorrect ? `✓ Correct (+${item.pointsAwarded} pts)` : "✕ Incorrect (0 pts)"}
                                                    </span>
                                                </div>

                                                {/* Question Text */}
                                                <h3 className="text-base font-semibold text-white leading-snug">
                                                    {item.questionText}
                                                </h3>

                                                {/* 4 Options with Green BG for correct & Checkmark for user selection */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                                    {item.options.map((opt, optIdx) => {
                                                        const isCorrect = item.correctOptionIds.includes(opt.id);
                                                        const isSelected = item.selectedOptionIds.includes(opt.id);

                                                        let containerStyle = "bg-white/2 border-white/6 text-neutral-400";
                                                        if (isCorrect) {
                                                            containerStyle = "bg-emerald-500/15 border-emerald-500/50 text-emerald-100 shadow-sm";
                                                        } else if (isSelected) {
                                                            containerStyle = "bg-red-500/15 border-red-500/40 text-red-200";
                                                        }

                                                        return (
                                                            <div
                                                                key={opt.id}
                                                                className={`p-3.5 rounded-xl border flex flex-col justify-between text-xs transition ${containerStyle}`}
                                                            >
                                                                <div className="flex justify-between items-center mb-1.5">
                                                                    <span className="font-mono font-bold text-neutral-400">
                                                                        {OPTION_LETTERS[optIdx % 4]}
                                                                    </span>
                                                                    
                                                                    {/* Tags for selection and correctness */}
                                                                    {isSelected && isCorrect && (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/25 border border-emerald-500/40 font-mono text-[10px] font-bold text-emerald-300">
                                                                            ✓ Your Choice (Correct)
                                                                        </span>
                                                                    )}
                                                                    {isSelected && !isCorrect && (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/25 border border-red-500/40 font-mono text-[10px] font-bold text-red-300">
                                                                            ✓ Your Choice (Wrong)
                                                                        </span>
                                                                    )}
                                                                    {!isSelected && isCorrect && (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                                                                            ✓ Correct Answer
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="font-medium text-sm text-neutral-100">
                                                                    {opt.text}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowSummary(false)}
                                            className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl border border-white/8 transition cursor-pointer"
                                        >
                                            ← Back to Results
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => navigate("/dashboard")}
                                            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition cursor-pointer"
                                        >
                                            Back to Home
                                        </button>
                                    </div>
                                </div>
                            );
                        }

                        // Default Game Over View (Standings & View Summary button)
                        return (
                            <div className="w-full space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Quiz Over</h2>
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

                                {/* Action Buttons */}
                                <div className="space-y-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setShowSummary(true)}
                                        className="relative group/btn w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-xs font-semibold rounded-xl border border-white/10 transition cursor-pointer shadow-[0px_1px_0px_0px_rgba(255,255,255,0.06)_inset] flex items-center justify-center gap-2"
                                    >
                                        <span>📋 View Summary</span>
                                        <span className="text-neutral-400">({correctCount}/{myAnswersReview.length} correct) →</span>
                                        <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-linear-to-r from-transparent via-neutral-500 to-transparent" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => navigate("/dashboard")}
                                        className="w-full py-2.5 bg-transparent hover:bg-white/4 text-neutral-400 hover:text-white text-xs font-medium rounded-xl border border-white/6 transition cursor-pointer"
                                    >
                                        Back to Home
                                    </button>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
};
