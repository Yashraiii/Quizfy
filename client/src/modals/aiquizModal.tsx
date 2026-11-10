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
            // Hitting your Groq backend endpoint
            const res = await api.post("/api/aiquiz/generate", {
                topic: topic.trim(),
                numberOfQuestions: Number(numberOfQuestions),
                questionType,
            });

            // Pass the newly created quiz back to Dashboard to refresh the list
            onQuizCreated(res.data);
            
            // Reset and close modal
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl shadow-purple-500/10">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-2">
                        <span className="text-xl">✨</span>
                        <h2 className="text-xl font-bold text-white">Generate Quiz with AI</h2>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="text-slate-400 hover:text-white transition text-lg cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleAiQuiz} className="space-y-4">
                    {/* Topic Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Quiz Topic
                        </label>
                        <input
                            type="text"
                            required
                            disabled={loading}
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g. JavaScript Async/Await, World History"
                            className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm"
                        />
                    </div>

                    {/* Number of Questions */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                Questions
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={30}
                                value={numberOfQuestions}
                                disabled={loading}
                                onChange={(e) => setNumberOfQuestions(Number(e.target.value))}
                                className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm"
                            />
                        </div>

                        {/* Question Type */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                Type
                            </label>
                            <select
                                value={questionType}
                                disabled={loading}
                                onChange={(e) => setQuestionType(e.target.value)}
                                className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm"
                            >
                                <option value="MCQ">Multiple Choice</option>
                                <option value="TRUE_FALSE">True / False</option>
                                <option value="MULTI_CORRECT">Multi Correct</option>
                            </select>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2.5 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl shadow-lg shadow-purple-600/30 transition text-sm flex items-center space-x-2 cursor-pointer"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <>
                                    <span>✨ Generate</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};