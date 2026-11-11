import { useState } from "react";
import api from "../api/axios";

interface AiQuizModalProps {
    isOpen: boolean;
    onClose: () => void;
    onQuizCreated: (newQuiz: any) => void;
}

export const AiQuizModal = ({ isOpen, onClose, onQuizCreated }: AiQuizModalProps) => {
    const [topic, setTopic] = useState("");
    const [numberOfQuestions, setNumberOfQuestions] = useState(5);
    const [questionType, setQuestionType] = useState("MCQ");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleAiQuiz = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) {
            return setError("Please enter a topic.");
        }

        setError("");
        setLoading(true);

        try {
            const res = await api.post("/api/aiquiz/generate", {
                topic: topic.trim(),
                numberOfQuestions: Number(numberOfQuestions),
                questionType,
            });

            onQuizCreated(res.data);
            setTopic("");
            onClose();
        } catch (err: any) {
            setError(
                err.response?.data?.message || 
                "Failed to generate quiz with AI. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 antialiased">
            <div className="w-full max-w-md bg-[#0a0a0a] border border-white/8 rounded-2xl p-6 shadow-2xl shadow-black relative">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 pb-3 border-b border-white/5">
                    <div>
                        <h2 className="text-base font-semibold text-neutral-100">
                            Generate Quiz with AI
                        </h2>
                        <p className="text-xs text-neutral-500 mt-0.5">
                            Powered by Groq LLM
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="text-neutral-500 hover:text-neutral-300 transition text-sm cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/[0.07] px-3.5 py-2.5 text-xs text-red-400">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleAiQuiz} className="space-y-4">
                    {/* Topic */}
                    <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                            Topic
                        </label>
                        <input
                            type="text"
                            required
                            disabled={loading}
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g. Modern JavaScript, World Geography"
                            className="w-full h-10 bg-zinc-900 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/20 transition"
                        />
                    </div>

                    {/* Question Count & Type */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                                Questions
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={30}
                                value={numberOfQuestions}
                                disabled={loading}
                                onChange={(e) => setNumberOfQuestions(Number(e.target.value))}
                                className="w-full h-9 bg-zinc-900 border border-white/8 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/20 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                                Question Type
                            </label>
                            <select
                                value={questionType}
                                disabled={loading}
                                onChange={(e) => setQuestionType(e.target.value)}
                                className="w-full h-9 bg-zinc-900 border border-white/8 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-white/20 transition cursor-pointer"
                            >
                                <option value="MCQ">Multiple Choice</option>
                                <option value="TRUE_FALSE">True / False</option>
                                <option value="MULTI_CORRECT">Multi-Select</option>
                            </select>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-white/5 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-3.5 py-2 text-xs font-medium text-neutral-500 hover:text-neutral-300 transition cursor-pointer"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="relative group/btn px-5 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-200 font-semibold text-xs rounded-xl border border-white/8 transition cursor-pointer shadow-[0px_1px_0px_0px_rgba(255,255,255,0.06)_inset]"
                        >
                            {loading ? "Generating..." : "Generate Quiz →"}
                            <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-linear-to-r from-transparent via-neutral-500 to-transparent" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
