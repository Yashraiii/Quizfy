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

const OPTION_LETTERS = ["A", "B", "C", "D"];

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
        if (isInitialLoad.current || !title.trim()) return;

        setSaveStatus("SAVING");
        const timer = setTimeout(async () => {
            try {
                if (activeQuizId) {
                    await api.put(`/api/quiz/${activeQuizId}`, {
                        title: title.trim(),
                        description: description.trim() || null,
                        questions,
                        status: "DRAFT",
                    });
                    setSaveStatus("SAVED");
                } else {
                    const res = await api.post("/api/quiz/create", {
                        title: title.trim(),
                        description: description.trim() || null,
                        questions,
                        status: "DRAFT",
                    });
                    setActiveQuizId(res.data.id);
                    window.history.replaceState(null, "", `/quiz/edit/${res.data.id}`);
                    setSaveStatus("SAVED");
                }
            } catch (err) {
                console.error("Auto-save failed:", err);
                setSaveStatus("ERROR");
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [title, description, questions, activeQuizId]);

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

    const handleRemoveQuestion = (qIndex: number) => {
        if (questions.length <= 1) {
            alert("A quiz must have at least 1 question.");
            return;
        }
        setQuestions((prev) => prev.filter((_, idx) => idx !== qIndex));
    };

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

    const handleUpdateOptionText = (qIndex: number, optIndex: number, text: string) => {
        setQuestions((prev) => {
            const updated = [...prev];
            const opts = [...updated[qIndex].options];
            opts[optIndex] = { ...opts[optIndex], text };
            updated[qIndex] = { ...updated[qIndex], options: opts };
            return updated;
        });
    };

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

    const handlePublish = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!title.trim()) {
            return setError("Please provide a Quiz title.");
        }

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
            <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-neutral-500 text-xs font-medium">Loading quiz...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent text-neutral-100 antialiased pb-24">
            {/* Header Navbar */}
            <div className="sticky top-0 z-20 border-b border-white/5 bg-[#080808]/85 backdrop-blur-xl px-6 py-3.5 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="text-neutral-500 hover:text-neutral-200 text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                    >
                        <span>← Dashboard</span>
                    </button>

                    {/* Auto-Save Status */}
                    <div className="text-[11px] font-medium text-neutral-500 flex items-center gap-1.5 border border-white/6 rounded-full px-2.5 py-0.5">
                        {saveStatus === "SAVING" && <span className="text-neutral-400">Saving draft...</span>}
                        {saveStatus === "SAVED" && <span className="text-neutral-300">Draft saved</span>}
                        {saveStatus === "ERROR" && <span className="text-red-400">Auto-save error</span>}
                        {saveStatus === "IDLE" && <span>Ready</span>}
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={handlePublish}
                        disabled={loading}
                        className="relative group/btn text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-white hover:text-black border border-white/8ded-lg px-3 py-1.5 transition duration-200 disabled:opacity-50 cursor-pointer shadow-[0px_1px_0px_0px_rgba(255,255,255,0.06)_inset]"
                    >
                        {loading ? "Publishing..." : "Publish Quiz"}
                        <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-linear-to-r from-transparent via-neutral-500 to-transparent" />
                    </button>
                </div>
            </div>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
                {/* Error Banner */}
                {error && (
                    <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/[0.07] px-4 py-3 text-xs text-red-400">
                        {error}
                    </div>
                )}

                {/* Quiz Info Card */}
                <div className="rounded-2xl border border-white/6 bg-white/2 p-6 mb-8 shadow-sm">
                    <h2 className="text-sm font-semibold text-neutral-200 mb-4">Quiz Details</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                                Quiz Title *
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Modern Web Development Fundamentals"
                                className="w-full h-10 bg-zinc-900 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/20 transition"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                                Description (Optional)
                            </label>
                            <textarea
                                rows={2}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief overview of what this quiz covers..."
                                className="w-full bg-zinc-900 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/20 transition resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Questions Section */}
                <div className="space-y-5">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-sm font-semibold text-neutral-200">
                            Questions ({questions.length})
                        </h2>
                        <button
                            type="button"
                            onClick={handleAddQuestion}
                            className="relative group/btn text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-white hover:text-black border border-white/8 rounded-lg px-3 py-1.5 transition duration-200 disabled:opacity-50 cursor-pointer shadow-[0px_1px_0px_0px_rgba(255,255,255,0.06)_inset]"
                    >
                            + Add Question
                        </button>
                    </div>

                    {questions.map((q, qIndex) => (
                        <div
                            key={qIndex}
                            className="rounded-2xl border border-white/6 bg-white/2 p-6 transition-all"
                        >
                            {/* Controls Header */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-3 border-b border-white/5">
                                <span className="font-mono text-xs font-semibold text-neutral-400">
                                    Q{qIndex + 1}
                                </span>

                                <div className="flex flex-wrap items-center gap-2">
                                    {/* Type */}
                                    <select
                                        value={q.type}
                                        onChange={(e) =>
                                            handleUpdateQuestion(qIndex, "type", e.target.value)
                                        }
                                        className="bg-zinc-900 border border-white/8 rounded-md px-2.5 py-1 text-xs text-neutral-300 focus:outline-none cursor-pointer"
                                    >
                                        <option value="MCQ">Multiple Choice</option>
                                        <option value="TRUE_FALSE">True / False</option>
                                        <option value="MULTI_CORRECT">Multi-Select</option>
                                    </select>

                                    {/* Time */}
                                    <select
                                        value={q.timeLimit}
                                        onChange={(e) =>
                                            handleUpdateQuestion(
                                                qIndex,
                                                "timeLimit",
                                                Number(e.target.value)
                                            )
                                        }
                                        className="bg-zinc-900 border border-white/8 rounded-md px-2.5 py-1 text-xs text-neutral-300 focus:outline-none cursor-pointer"
                                    >
                                        <option value={5}>5 sec</option>
                                        <option value={10}>10 sec</option>
                                        <option value={20}>20 sec</option>
                                        <option value={30}>30 sec</option>
                                        <option value={60}>60 sec</option>
                                        <option value={120}>120 sec</option>
                                    </select>

                                    {/* Points */}
                                    <select
                                        value={q.points}
                                        onChange={(e) =>
                                            handleUpdateQuestion(
                                                qIndex,
                                                "points",
                                                Number(e.target.value)
                                            )
                                        }
                                        className="bg-zinc-900 border border-white/8 rounded-md px-2.5 py-1 text-xs text-neutral-300 focus:outline-none cursor-pointer"
                                    >
                                        <option value={1000}>1,000 pts</option>
                                        <option value={2000}>2,000 pts</option>
                                        <option value={0}>0 pts</option>
                                    </select>

                                    {/* Remove */}
                                    {questions.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveQuestion(qIndex)}
                                            className="text-xs text-neutral-600 hover:text-red-400 ml-1 transition cursor-pointer"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Question text */}
                            <div className="mb-4">
                                <input
                                    type="text"
                                    value={q.text}
                                    onChange={(e) =>
                                        handleUpdateQuestion(qIndex, "text", e.target.value)
                                    }
                                    placeholder="Type question here..."
                                    className="w-full bg-zinc-900/80 border border-white/8 rounded-lg px-3.5 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/20 transition font-medium"
                                />
                            </div>

                            {/* Options Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {q.options.map((opt, optIndex) => (
                                    <div
                                        key={optIndex}
                                        className={`px-3 py-2 rounded-xl border flex items-center space-x-2.5 transition ${
                                            opt.isCorrect
                                                ? "bg-white/6er-white/[0.2]"
                                                : "bg-white/2 border-white/5 hover:border-white/10"
                                        }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleToggleCorrectOption(qIndex, optIndex)
                                            }
                                            className={`w-5 h-5 rounded-full border flex items-center justify-center text-[11px] font-bold transition cursor-pointer shrink-0 ${
                                                opt.isCorrect
                                                    ? "bg-white text-black border-white"
                                                    : "border-neutral-700 text-transparent hover:border-neutral-500"
                                            }`}
                                        >
                                            ✓
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
                                            className="w-full bg-transparent border-none text-white text-xs focus:outline-none placeholder:text-neutral-600"
                                        />

                                        <span className="text-[10px] font-mono text-neutral-600 font-semibold shrink-0">
                                            {OPTION_LETTERS[optIndex % 4]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/5">
                    <button
                        type="button"
                        onClick={handleAddQuestion}
                        className="relative group/btn text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-white hover:text-black border border-white/8 rounded-lg px-3 py-1.5 transition duration-200 disabled:opacity-50 cursor-pointer shadow-[0px_1px_0px_0px_rgba(255,255,255,0.06)_inset]"
                    >
                        + Add Question
                    </button>
                    <button
                        type="button"
                        onClick={handlePublish}
                        disabled={loading}
                       className="relative group/btn text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-white hover:text-black border border-white/8 rounded-lg px-3 py-1.5 transition duration-200 disabled:opacity-50 cursor-pointer shadow-[0px_1px_0px_0px_rgba(255,255,255,0.06)_inset]"
                    >
                        {loading ? "Publishing..." : "Publish Quiz"}
                        <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-linear-to-r from-transparent via-neutral-500 to-transparent" />
                    </button>
                </div>
            </main>
        </div>
    );
};
