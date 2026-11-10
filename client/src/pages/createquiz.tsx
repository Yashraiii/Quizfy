import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";

interface Option {
    text: string;
    isCorrect: boolean;
}

interface Question {
    text: string;
    type: "MCQ" | "TRUE_FALSE" | "MULTI_CORRECT";
    timeLimit: number;
    points: number;
    options: Option[];
}

const COLOR_BADGES = [
    { label: "Red 🔺", bg: "border-red-500/50 bg-red-500/10 text-red-400" },
    { label: "Blue 🔷", bg: "border-blue-500/50 bg-blue-500/10 text-blue-400" },
    { label: "Yellow 🟡", bg: "border-amber-500/50 bg-amber-500/10 text-amber-400" },
    { label: "Green 🟩", bg: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" },
];

export const Createquiz = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const [activeQuizId, setActiveQuizId] = useState<string | null>(id || null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetchingQuiz, setFetchingQuiz] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"IDLE" | "SAVING" | "SAVED" | "ERROR">("IDLE");
    const [error, setError] = useState("");

    const isInitialLoad = useRef(true);

    const [questions, setQuestions] = useState<Question[]>([
        {
            text: "",
            type: "MCQ",
            timeLimit: 20,
            points: 1000,
            options: [
                { text: "", isCorrect: true },
                { text: "", isCorrect: false },
                { text: "", isCorrect: false },
                { text: "", isCorrect: false },
            ],
        },
    ]);

    // 1. Fetch existing quiz if opened via /quiz/edit/:id
    useEffect(() => {
        if (!id) {
            isInitialLoad.current = false;
            return;
        }

        const fetchQuizForEdit = async () => {
            try {
                setFetchingQuiz(true);
                const res = await api.get(`/api/quiz/${id}`);
                const quiz = res.data;

                setTitle(quiz.title);
                setDescription(quiz.description || "");
                setActiveQuizId(quiz.id);

                if (quiz.quizQuestions && quiz.quizQuestions.length > 0) {
                    setQuestions(
                        quiz.quizQuestions.map((qq: any) => ({
                            text: qq.question.text,
                            type: qq.question.type || "MCQ",
                            timeLimit: qq.question.timeLimit || 20,
                            points: qq.question.points || 1000,
                            options: qq.question.options.map((opt: any) => ({
                                text: opt.text,
                                isCorrect: opt.isCorrect,
                            })),
                        }))
                    );
                }
            } catch (err: any) {
                setError("Failed to load quiz details for editing.");
            } finally {
                setFetchingQuiz(false);
                setTimeout(() => {
                    isInitialLoad.current = false;
                }, 500);
            }
        };

        fetchQuizForEdit();
    }, [id]);

    // 2. Debounced Auto-Save as DRAFT in Background
    useEffect(() => {
        // Don't auto-save while fetching existing quiz or if title is empty
        if (isInitialLoad.current || !title.trim()) return;

        setSaveStatus("SAVING");
        const timer = setTimeout(async () => {
            try {
                if (activeQuizId) {
                    // Update existing draft
                    await api.put(`/api/quiz/${activeQuizId}`, {
                        title: title.trim(),
                        description: description.trim() || null,
                        questions,
                        status: "DRAFT",
                    });
                    setSaveStatus("SAVED");
                } else {
                    // Create new draft in database
                    const res = await api.post("/api/quiz/create", {
                        title: title.trim(),
                        description: description.trim() || null,
                        questions,
                        status: "DRAFT",
                    });
                    setActiveQuizId(res.data.id);
                    // Update browser URL silently to edit mode so refreshes won't duplicate
                    window.history.replaceState(null, "", `/quiz/edit/${res.data.id}`);
                    setSaveStatus("SAVED");
                }
            } catch (err) {
                console.error("Auto-save failed:", err);
                setSaveStatus("ERROR");
            }
        }, 1500); // 1.5 second debounce

        return () => clearTimeout(timer);
    }, [title, description, questions, activeQuizId]);

    // Add a new question template
    const handleAddQuestion = () => {
        setQuestions((prev) => [
            ...prev,
            {
                text: "",
                type: "MCQ",
                timeLimit: 20,
                points: 1000,
                options: [
                    { text: "", isCorrect: true },
                    { text: "", isCorrect: false },
                    { text: "", isCorrect: false },
                    { text: "", isCorrect: false },
                ],
            },
        ]);
    };

    // Remove a question
    const handleRemoveQuestion = (qIndex: number) => {
        if (questions.length <= 1) {
            alert("A quiz must have at least 1 question.");
            return;
        }
        setQuestions((prev) => prev.filter((_, idx) => idx !== qIndex));
    };

    // Update question metadata
    const handleUpdateQuestion = (qIndex: number, field: keyof Question, value: any) => {
        setQuestions((prev) => {
            const updated = [...prev];
            const q = { ...updated[qIndex], [field]: value };

            if (field === "type" && value === "TRUE_FALSE") {
                q.options = [
                    { text: "True", isCorrect: true },
                    { text: "False", isCorrect: false },
                ];
            } else if (field === "type" && value !== "TRUE_FALSE" && q.options.length === 2) {
                q.options = [
                    { text: "", isCorrect: true },
                    { text: "", isCorrect: false },
                    { text: "", isCorrect: false },
                    { text: "", isCorrect: false },
                ];
            }

            updated[qIndex] = q;
            return updated;
        });
    };

    // Update option text
    const handleUpdateOptionText = (qIndex: number, optIndex: number, text: string) => {
        setQuestions((prev) => {
            const updated = [...prev];
            const opts = [...updated[qIndex].options];
            opts[optIndex] = { ...opts[optIndex], text };
            updated[qIndex] = { ...updated[qIndex], options: opts };
            return updated;
        });
    };

    // Toggle correct answer
    const handleToggleCorrectOption = (qIndex: number, optIndex: number) => {
        setQuestions((prev) => {
            const updated = [...prev];
            const q = updated[qIndex];
            const opts = q.options.map((opt, idx) => {
                if (q.type === "MULTI_CORRECT") {
                    return idx === optIndex ? { ...opt, isCorrect: !opt.isCorrect } : opt;
                }
                return { ...opt, isCorrect: idx === optIndex };
            });
            updated[qIndex] = { ...q, options: opts };
            return updated;
        });
    };

    // 3. Final Publish Button (Validates & saves as PUBLISHED)
    const handlePublish = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!title.trim()) {
            return setError("Please provide a Quiz title.");
        }

        // Validate each question before publishing
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.text.trim()) {
                return setError(`Question ${i + 1} is missing its question statement.`);
            }

            for (let j = 0; j < q.options.length; j++) {
                if (!q.options[j].text.trim()) {
                    return setError(`Question ${i + 1}, Option ${j + 1} cannot be empty.`);
                }
            }

            const hasCorrectAnswer = q.options.some((o) => o.isCorrect);
            if (!hasCorrectAnswer) {
                return setError(`Question ${i + 1} must have at least one correct answer selected.`);
            }
        }

        setLoading(true);

        try {
            if (activeQuizId) {
                await api.put(`/api/quiz/${activeQuizId}`, {
                    title: title.trim(),
                    description: description.trim() || null,
                    questions,
                    status: "PUBLISHED",
                });
            } else {
                await api.post("/api/quiz/create", {
                    title: title.trim(),
                    description: description.trim() || null,
                    questions,
                    status: "PUBLISHED",
                });
            }

            navigate("/dashboard");
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to publish quiz. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (fetchingQuiz) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">Loading quiz details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
            {/* Header Navbar */}
            <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-20 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="text-slate-400 hover:text-white text-sm flex items-center space-x-1 cursor-pointer"
                    >
                        <span>← Back to Dashboard</span>
                    </button>

                    {/* Auto-Save Status Pill */}
                    <div className="text-xs hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60">
                        {saveStatus === "SAVING" && (
                            <span className="text-amber-400 flex items-center space-x-1 font-medium">
                                <span className="animate-spin">🔄</span>
                                <span>Saving draft...</span>
                            </span>
                        )}
                        {saveStatus === "SAVED" && (
                            <span className="text-emerald-400 flex items-center space-x-1 font-medium">
                                <span>☁️</span>
                                <span>Draft saved</span>
                            </span>
                        )}
                        {saveStatus === "ERROR" && (
                            <span className="text-red-400 font-medium">⚠️ Auto-save failed</span>
                        )}
                        {saveStatus === "IDLE" && (
                            <span className="text-slate-400">📝 Auto-save ready</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={handlePublish}
                        disabled={loading}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition cursor-pointer flex items-center space-x-1.5"
                    >
                        {loading ? (
                            <span>Publishing...</span>
                        ) : (
                            <>
                                <span>🚀</span>
                                <span>Publish Quiz</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
                {/* Error Banner */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                {/* Quiz Info Header Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 shadow-xl">
                    <h2 className="text-xl font-bold text-white mb-4">Quiz Details</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                Quiz Title *
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Modern Web Development Fundamentals"
                                className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                Description (Optional)
                            </label>
                            <textarea
                                rows={2}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief summary of what this quiz covers..."
                                className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Questions Section */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">
                            Questions ({questions.length})
                        </h2>
                        <button
                            type="button"
                            onClick={handleAddQuestion}
                            className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-sm font-medium transition cursor-pointer"
                        >
                            + Add Question
                        </button>
                    </div>

                    {questions.map((q, qIndex) => (
                        <div
                            key={qIndex}
                            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative"
                        >
                            {/* Question Controls Header */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-4 border-b border-slate-800">
                                <span className="font-bold text-indigo-400 text-sm">
                                    Question {qIndex + 1}
                                </span>

                                <div className="flex flex-wrap items-center gap-2.5">
                                    {/* 1. Question Type Selector */}
                                    <div className="flex items-center space-x-1">
                                        <span className="text-[11px] text-slate-400">Type:</span>
                                        <select
                                            value={q.type}
                                            onChange={(e) =>
                                                handleUpdateQuestion(qIndex, "type", e.target.value)
                                            }
                                            className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="MCQ">Multiple Choice</option>
                                            <option value="TRUE_FALSE">True / False</option>
                                            <option value="MULTI_CORRECT">Multi Correct</option>
                                        </select>
                                    </div>

                                    {/* 2. Time Limit Selector */}
                                    <div className="flex items-center space-x-1">
                                        <span className="text-[11px] text-slate-400">Time:</span>
                                        <select
                                            value={q.timeLimit}
                                            onChange={(e) =>
                                                handleUpdateQuestion(
                                                    qIndex,
                                                    "timeLimit",
                                                    Number(e.target.value)
                                                )
                                            }
                                            className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value={5}>⏱️ 5 sec</option>
                                            <option value={10}>⏱️ 10 sec</option>
                                            <option value={20}>⏱️ 20 sec</option>
                                            <option value={30}>⏱️ 30 sec</option>
                                            <option value={60}>⏱️ 1 min</option>
                                            <option value={90}>⏱️ 1.5 min</option>
                                            <option value={120}>⏱️ 2 min</option>
                                        </select>
                                    </div>

                                    {/* 3. Points Selector */}
                                    <div className="flex items-center space-x-1">
                                        <span className="text-[11px] text-slate-400">Points:</span>
                                        <select
                                            value={q.points}
                                            onChange={(e) =>
                                                handleUpdateQuestion(
                                                    qIndex,
                                                    "points",
                                                    Number(e.target.value)
                                                )
                                            }
                                            className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value={1000}>💎 1,000 Standard</option>
                                            <option value={2000}>🔥 2,000 Double</option>
                                            <option value={0}>⚪ 0 No Points</option>
                                        </select>
                                    </div>

                                    {/* Delete Question */}
                                    {questions.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveQuestion(qIndex)}
                                            className="text-xs text-red-400 hover:text-red-300 font-medium ml-2 transition cursor-pointer"
                                        >
                                            ✕ Remove
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Question Statement Input */}
                            <div className="mb-5">
                                <input
                                    type="text"
                                    value={q.text}
                                    onChange={(e) =>
                                        handleUpdateQuestion(qIndex, "text", e.target.value)
                                    }
                                    placeholder="Type your question statement here..."
                                    className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                                />
                            </div>

                            {/* Options Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {q.options.map((opt, optIndex) => {
                                    const badge = COLOR_BADGES[optIndex % COLOR_BADGES.length];
                                    return (
                                        <div
                                            key={optIndex}
                                            className={`p-3 rounded-xl border flex items-center space-x-3 transition ${
                                                opt.isCorrect
                                                    ? "bg-emerald-500/10 border-emerald-500/50"
                                                    : "bg-slate-800/40 border-slate-800 hover:border-slate-700"
                                            }`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleToggleCorrectOption(qIndex, optIndex)
                                                }
                                                className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold transition cursor-pointer shrink-0 ${
                                                    opt.isCorrect
                                                        ? "bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-500/30"
                                                        : "border-slate-600 text-slate-500 hover:border-slate-400"
                                                }`}
                                            >
                                                {opt.isCorrect ? "✓" : ""}
                                            </button>

                                            <input
                                                type="text"
                                                value={opt.text}
                                                disabled={q.type === "TRUE_FALSE"}
                                                onChange={(e) =>
                                                    handleUpdateOptionText(
                                                        qIndex,
                                                        optIndex,
                                                        e.target.value
                                                    )
                                                }
                                                placeholder={`Option ${optIndex + 1}`}
                                                className="w-full bg-transparent border-none text-white text-sm focus:outline-none placeholder-slate-500"
                                            />

                                            <span
                                                className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border shrink-0 ${badge.bg}`}
                                            >
                                                {badge.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom Action Bar */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-800">
                    <button
                        type="button"
                        onClick={handleAddQuestion}
                        className="px-5 py-2.5 bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 rounded-xl text-sm font-medium transition cursor-pointer"
                    >
                        + Add Another Question
                    </button>
                    <button
                        type="button"
                        onClick={handlePublish}
                        disabled={loading}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition cursor-pointer flex items-center space-x-1.5"
                    >
                        {loading ? (
                            <span>Publishing...</span>
                        ) : (
                            <>
                                <span>🚀</span>
                                <span>Publish Quiz</span>
                            </>
                        )}
                    </button>
                </div>
            </main>
        </div>
    );
};
