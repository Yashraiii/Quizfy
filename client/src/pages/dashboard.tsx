import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AiQuizModal } from "../modals/aiquizModal";
import { QuizDetailsModal } from "../modals/quizModal";
import api from "../api/axios";
import { cn } from "../lib/utils";

interface Quiz {
    id: string;
    title: string;
    description: string | null;
    status: string;
    createdAt: string;
}

// ── Thin divider ─────────────────────────────────────────────────────────────
const Divider = () => (
    <div className="bg-linear-to-r from-transparent via-neutral-800 to-transparent h-px w-full" />
);

// ── Skeleton card ─────────────────────────────────────────────────────────────
const SkeletonCard = () => (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-6 space-y-3 animate-pulse shadow-lg">
        <div className="h-4 w-2/3 rounded bg-zinc-800" />
        <div className="h-3 w-1/3 rounded bg-zinc-800/60" />
        <div className="h-3 w-full rounded bg-zinc-800/60" />
        <div className="h-3 w-4/5 rounded bg-zinc-800/60" />
        <div className="pt-4 mt-2 border-t border-zinc-800/80 flex justify-between">
            <div className="h-7 w-24 rounded-lg bg-zinc-800" />
            <div className="h-7 w-7 rounded-lg bg-zinc-800/60" />
        </div>
    </div>
);

// ── Quiz Card ─────────────────────────────────────────────────────────────────
const QuizCard = ({
    quiz,
    onHost,
    onEdit,
    onViewQuestions,
    onDelete,
    isStarting,
}: {
    quiz: Quiz;
    onHost: () => void;
    onEdit: () => void;
    onViewQuestions: () => void;
    onDelete: () => void;
    isStarting: boolean;
}) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const isDraft = quiz.status === "DRAFT";

    return (
        <div
            className="group relative rounded-2xl border border-zinc-800/80 bg-zinc-950/85 hover:bg-zinc-900/90 hover:border-zinc-700/80 hover:shadow-2xl hover:shadow-black/70 hover:-translate-y-0.5 transition-all duration-300 p-6 flex flex-col justify-between backdrop-blur-md"
        >
            {/* Top */}
            <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 flex-1">
                        {quiz.title}
                    </h3>
                    <span
                        className={cn(
                            "shrink-0 text-[10px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full border",
                            isDraft
                                ? "border-amber-500/30 text-amber-400 bg-amber-500/10"
                                : "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                        )}
                    >
                        {isDraft ? "Draft" : "Published"}
                    </span>
                </div>
                <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                    {quiz.description || "No description provided."}
                </p>
            </div>

            {/* Bottom action bar */}
            <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                {isDraft ? (
                    <button
                        onClick={onEdit}
                        className="relative group/btn text-xs font-medium text-neutral-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 rounded-lg px-3 py-1.5 transition duration-200 cursor-pointer"
                    >
                        Edit Draft
                    </button>
                ) : (
                    <button
                        onClick={onHost}
                        disabled={isStarting}
                        className="relative group/btn text-xs font-semibold text-neutral-100 bg-zinc-900 hover:bg-white hover:text-black border border-zinc-700/80 rounded-lg px-3.5 py-1.5 transition duration-200 disabled:opacity-50 cursor-pointer shadow-[0px_1px_0px_0px_rgba(255,255,255,0.08)_inset]"
                    >
                        {isStarting ? "Starting..." : "Host Live"}
                        {/* BottomGradient */}
                        <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-linear-to-r from-transparent via-neutral-400 to-transparent" />
                    </button>
                )}

                {/* 3-dot menu */}
                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen((p) => !p);
                        }}
                        className="w-7 h-7 rounded-lg text-neutral-400 hover:text-white hover:bg-zinc-800/80 flex items-center justify-center transition cursor-pointer text-base font-bold"
                    >
                        ⋮
                    </button>

                    {menuOpen && (
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 bottom-9 w-44 rounded-xl border border-zinc-800 bg-zinc-950/95 backdrop-blur-xl shadow-2xl shadow-black/80 py-1 z-30"
                        >
                            <button
                                onClick={() => { setMenuOpen(false); onEdit(); }}
                                className="w-full px-4 py-2 text-left text-xs text-neutral-300 hover:text-white hover:bg-zinc-800/60 transition cursor-pointer"
                            >
                                Edit quiz
                            </button>
                            <button
                                onClick={() => { setMenuOpen(false); onViewQuestions(); }}
                                className="w-full px-4 py-2 text-left text-xs text-neutral-300 hover:text-white hover:bg-zinc-800/60 transition cursor-pointer"
                            >
                                View questions
                            </button>
                            <div className="h-px bg-zinc-800/80 my-1 mx-3" />
                            <button
                                onClick={() => { setMenuOpen(false); onDelete(); }}
                                className="w-full px-4 py-2 text-left text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition cursor-pointer"
                            >
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const DashBoard = () => {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [startingSessionId, setStartingSessionId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
    const [joinBoxOpen, setJoinBoxOpen] = useState(false);
    const [joinPin, setJoinPin] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) { navigate("/login"); return; }
        fetchQuizzes();
    }, [navigate]);

    // close menus on outside click
    useEffect(() => {
        const close = () => {};
        document.addEventListener("click", close);
        return () => document.removeEventListener("click", close);
    }, []);

    const fetchQuizzes = async () => {
        try {
            setLoading(true);
            const res = await api.get("/api/quiz/userquizzes");
            setQuizzes(res.data);
        } catch (err: any) {
            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                navigate("/login");
            } else {
                setError("Failed to load your quizzes.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleHostGame = async (quizId: string) => {
        try {
            setStartingSessionId(quizId);
            const res = await api.post("/api/sessions/create", { quizId });
            navigate(`/host/${res.data.session.roomCode}`);
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to create session.");
        } finally {
            setStartingSessionId(null);
        }
    };

    const handleDeleteQuiz = async (quizId: string) => {
        if (!confirm("Delete this quiz?")) return;
        try {
            await api.delete(`/api/quiz/${quizId}`);
            setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
        } catch {
            alert("Failed to delete quiz.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    return (
        <div className="max-h-screen bg-blend-darken text-neutral-100 antialiased">

            {/* ── Navbar ── */}
            <nav className="sticky top-0 z-20 border-b border-white/5 bg-[#080808]/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-xl font-black tracking-tight text-white">
                        Quiz<span className="text-indigo-400">fy</span>
                    </span>
                    <span className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest border border-white/6 rounded-full px-2 py-0.5">
                        Studio
                    </span>
                </div>
                <button
                    onClick={handleLogout}
                   className="relative group/btn text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-white hover:text-black border border-white/8 rounded-lg px-3 py-1.5 transition duration-200 disabled:opacity-50 cursor-pointer shadow-[0px_1px_0px_0px_rgba(255,255,255,0.06)_inset]"
                    >
                    Sign out
                </button>
            </nav>

            {/* ── Main ── */}
            <main className="max-w-6xl mx-auto px-6 py-10">

                {/* Header row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-100">Your Quizzes</h1>
                        <p className="text-sm text-neutral-600 mt-1">
                            Create, manage, and host live games.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Generate AI */}
                        <button
                            onClick={() => setIsAiModalOpen(true)}
                            className="relative group/btn text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-white hover:text-black border border-white/8 rounded-lg px-3 py-1.5 transition duration-200 disabled:opacity-50 cursor-pointer shadow-[0px_1px_0px_0px_rgba(255,255,255,0.06)_inset]"
                    >
                            ✦ Generate with AI
                        </button>

                        {/* Join Game Box */}
                        {joinBoxOpen ? (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (joinPin.trim()) navigate(`/play/${joinPin.trim()}`);
                                }}
                                className="flex items-center gap-1.5 bg-zinc-900/90 border border-white/10 rounded-xl px-2.5 py-1 shadow-lg"
                            >
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="Enter code..."
                                    value={joinPin}
                                    onChange={(e) => setJoinPin(e.target.value)}
                                    className="bg-transparent border-none text-xs text-white placeholder:text-neutral-500 focus:outline-none w-28 uppercase font-mono tracking-wider"
                                />
                                <button
                                    type="submit"
                                    className="text-xs font-semibold px-2.5 py-1 bg-white/8 hover:bg-white/15 text-white rounded-lg transition cursor-pointer"
                                >
                                    Join
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setJoinBoxOpen(false)}
                                    className="text-neutral-500 hover:text-neutral-300 text-xs px-1 cursor-pointer"
                                >
                                    ✕
                                </button>
                            </form>
                        ) : (
                            <button
                                onClick={() => setJoinBoxOpen(true)}
                                className="relative group/btn text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-white hover:text-black border border-white/8 rounded-lg px-3 py-1.5 transition duration-200 disabled:opacity-50 cursor-pointer shadow-[0px_1px_0px_0px_rgba(255,255,255,0.06)_inset]"
                            >
                                Join game
                            </button>
                        )}

                        {/* Create Quiz */}
                        <button
                            onClick={() => navigate("/quiz/create")}
                            className="relative group/btn text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-white hover:text-black border border-white/8 rounded-lg px-3 py-1.5 transition duration-200 disabled:opacity-50 cursor-pointer shadow-[0px_1px_0px_0px_rgba(255,255,255,0.06)_inset]"
                        >
                            + New quiz
                            <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-linear-to-r from-transparent via-neutral-500 to-transparent" />
                        </button>
                    </div>
                </div>

                <Divider />

                {/* Error */}
                {error && (
                    <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/[0.07] px-4 py-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {/* Quiz grid */}
                <div className="mt-8">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
                        </div>
                    ) : quizzes.length === 0 ? (
                        /* Empty state */
                        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md shadow-xl">
                            <div className="w-14 h-14 rounded-2xl border border-zinc-800 bg-zinc-900/80 flex items-center justify-center text-2xl mb-5 shadow-inner">
                                📋
                            </div>
                            <h3 className="text-base font-semibold text-white">No quizzes yet</h3>
                            <p className="mt-2 text-sm text-neutral-400 max-w-xs">
                                Create your first quiz manually or generate one instantly with AI.
                            </p>
                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => setIsAiModalOpen(true)}
                                    className="text-xs font-medium text-neutral-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 rounded-xl px-4 py-2.5 transition cursor-pointer"
                                >
                                    ✦ Generate with AI
                                </button>
                                <button
                                    onClick={() => navigate("/quiz/create")}
                                    className="relative group/btn text-xs font-semibold text-neutral-100 bg-zinc-900 hover:bg-white hover:text-black border border-zinc-700/80 rounded-xl px-4 py-2.5 transition duration-200 cursor-pointer shadow-[0px_1px_0px_0px_rgba(255,255,255,0.08)_inset]"
                                >
                                    + New quiz
                                    <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-linear-to-r from-transparent via-neutral-400 to-transparent" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {quizzes.map((quiz) => (
                                <QuizCard
                                    key={quiz.id}
                                    quiz={quiz}
                                    isStarting={startingSessionId === quiz.id}
                                    onHost={() => handleHostGame(quiz.id)}
                                    onEdit={() => navigate(`/quiz/edit/${quiz.id}`)}
                                    onViewQuestions={() => setSelectedQuizId(quiz.id)}
                                    onDelete={() => handleDeleteQuiz(quiz.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Modals */}
            <AiQuizModal
                isOpen={isAiModalOpen}
                onClose={() => setIsAiModalOpen(false)}
                onQuizCreated={(newQuiz) => setQuizzes((prev) => [newQuiz, ...prev])}
            />
            <QuizDetailsModal
                quizId={selectedQuizId}
                onClose={() => setSelectedQuizId(null)}
            />
        </div>
    );
};
