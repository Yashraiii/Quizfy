import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AiQuizModal } from "../modals/aiquizModal";
import { QuizDetailsModal } from "../modals/quizModal";
import api from "../api/axios";

interface Quiz {
    id: string;
    title: string;
    description: string | null;
    status: string;
    createdAt: string;
}

export const DashBoard = () => {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [startingSessionId, setStartingSessionId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
    const [menuOpenQuizId, setMenuOpenQuizId] = useState<string | null>(null);

    const navigate = useNavigate();

    // 1. Fetch user quizzes on component mount with auth check
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
        fetchQuizzes();
    }, [navigate]);

    // Close 3-dots dropdown when clicking anywhere else on screen
    useEffect(() => {
        const handleClickOutside = () => setMenuOpenQuizId(null);
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
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
                setError("Failed to load your quizzes. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    // 2. Start a Live Game Room (Kahoot Host)
    const handleHostGame = async (quizId: string) => {
        try {
            setStartingSessionId(quizId);
            const res = await api.post("/api/sessions/create", { quizId });
            const roomCode = res.data.session.roomCode;
            navigate(`/host/${roomCode}`);
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to create live game session.");
        } finally {
            setStartingSessionId(null);
        }
    };

    // 3. Delete Quiz
    const handleDeleteQuiz = async (quizId: string) => {
        if (!confirm("Are you sure you want to delete this quiz?")) return;

        try {
            await api.delete(`/api/quiz/${quizId}`);
            setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
        } catch (err: any) {
            alert("Failed to delete quiz.");
        }
    };

    // 4. Logout
    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            {/* Top Navigation Bar */}
            <nav className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-20 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                        Quizfy
                    </span>
                    <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-medium">
                        Host Studio
                    </span>
                </div>

                <div className="flex items-center space-x-4">
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-sm text-slate-400 hover:text-white transition cursor-pointer"
                    >
                        Sign Out
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 py-10">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Your Quizzes</h1>
                        <p className="text-slate-400 text-sm mt-1">
                            Create, manage, and host live interactive games.
                        </p>
                    </div>

                    <div className="flex items-center space-x-3">
                        {/* Generate AI Button */}
                        <button
                            onClick={() => setIsAiModalOpen(true)}
                            className="px-4 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-medium rounded-xl transition flex items-center space-x-2 cursor-pointer text-sm"
                        >
                            <span>✨ Generate with AI</span>
                        </button>

                        {/* Join Game with PIN */}
                        <button
                            onClick={() => {
                                const pin = prompt("Enter Game PIN:");
                                if (pin) navigate(`/play/${pin.trim()}`);
                            }}
                            className="px-4 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-medium rounded-xl transition cursor-pointer text-sm"
                        >
                            🎮 Join Game
                        </button>

                        {/* Create Quiz Button */}
                        <button
                            onClick={() => navigate("/quiz/create")}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/30 transition cursor-pointer text-sm"
                        >
                            + Create Quiz
                        </button>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                {/* Quiz Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-48 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse"
                            />
                        ))}
                    </div>
                ) : quizzes.length === 0 ? (
                    /* Empty State */
                    <div className="text-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
                        <div className="text-4xl mb-3">🎯</div>
                        <h3 className="text-lg font-semibold text-white">No quizzes yet</h3>
                        <p className="text-slate-400 text-sm mt-1 mb-6">
                            Create your first quiz or generate one instantly using AI!
                        </p>
                        <button
                            onClick={() => navigate("/quiz/create")}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition text-sm cursor-pointer"
                        >
                            Create First Quiz
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {quizzes.map((quiz) => (
                            <div
                                key={quiz.id}
                                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 transition flex flex-col justify-between shadow-lg relative"
                            >
                                <div>
                                    <div className="flex justify-between items-start gap-2 mb-2">
                                        <h3 className="text-lg font-bold text-white line-clamp-1 pr-2">
                                            {quiz.title}
                                        </h3>
                                        <span
                                            className={`text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border ${
                                                quiz.status === "PUBLISHED"
                                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                                    : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                            }`}
                                        >
                                            {quiz.status === "PUBLISHED" ? "✓ Published" : "📝 Draft"}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                                        {quiz.description || "No description provided."}
                                    </p>
                                </div>

                                {/* Footer Action Bar */}
                                
                                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between relative">
                                    {/* Action Button: Host Live if PUBLISHED, or Edit if DRAFT */}
                                    {quiz.status === "DRAFT" ? (
                                        <button
                                            onClick={() => navigate(`/quiz/edit/${quiz.id}`)}
                                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-lg border border-amber-500/30 transition flex items-center space-x-1.5 cursor-pointer"
                                        >
                                            <span>✏️</span>
                                            <span>Edit Draft</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleHostGame(quiz.id)}
                                            disabled={startingSessionId === quiz.id}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-semibold rounded-lg shadow-md shadow-indigo-600/20 transition flex items-center space-x-1.5 cursor-pointer"
                                        >
                                            {startingSessionId === quiz.id ? (
                                                <span>Starting...</span>
                                            ) : (
                                                <>
                                                    <span>🚀</span>
                                                    <span>Host Live</span>
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {/* 3-Dots Menu Trigger (Kahoot Style) */}
                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setMenuOpenQuizId(
                                                    menuOpenQuizId === quiz.id ? null : quiz.id
                                                );
                                            }}
                                            className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-lg font-bold transition cursor-pointer"
                                        >
                                            ⋮
                                        </button>

                                        {/* Dropdown Menu */}
                                        {menuOpenQuizId === quiz.id && (
                                            <div
                                                onClick={(e) => e.stopPropagation()}
                                                className="absolute right-0 bottom-10 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-30 backdrop-blur-md"
                                            >
                                                {/* Edit Quiz Option */}
                                                <button
                                                    onClick={() => {
                                                        setMenuOpenQuizId(null);
                                                        navigate(`/quiz/edit/${quiz.id}`);
                                                    }}
                                                    className="w-full px-4 py-2 text-left text-xs text-slate-200 hover:bg-slate-800 flex items-center space-x-2.5 transition cursor-pointer"
                                                >
                                                    <span></span>
                                                    <span>Edit Quiz</span>
                                                </button>

                                                {/* View Questions Option */}
                                                <button
                                                    onClick={() => {
                                                        setMenuOpenQuizId(null);
                                                        setSelectedQuizId(quiz.id);
                                                    }}
                                                    className="w-full px-4 py-2 text-left text-xs text-slate-200 hover:bg-slate-800 flex items-center space-x-2.5 transition cursor-pointer"
                                                >
                                                    <span></span>
                                                    <span>View Questions</span>
                                                </button>

                                                <div className="h-[1px] bg-slate-800 my-1" />

                                                {/* Delete Option */}
                                                <button
                                                    onClick={() => {
                                                        setMenuOpenQuizId(null);
                                                        handleDeleteQuiz(quiz.id);
                                                    }}
                                                    className="w-full px-4 py-2 text-left text-xs text-red-400 hover:bg-red-500/10 flex items-center space-x-2.5 transition cursor-pointer"
                                                >
                                                    <span>🗑️</span>
                                                    <span>Delete</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* AI Generation Modal */}
            <AiQuizModal
                isOpen={isAiModalOpen}
                onClose={() => setIsAiModalOpen(false)}
                onQuizCreated={(newQuiz) => {
                    setQuizzes((prev) => [newQuiz, ...prev]);
                }}
            />

            {/* Quiz Questions Preview Modal */}
            <QuizDetailsModal
                quizId={selectedQuizId}
                onClose={() => setSelectedQuizId(null)}
            />
        </div>
    );
};