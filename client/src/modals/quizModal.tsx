import { useEffect, useState } from "react";
import api from "../api/axios";

interface Option {
    id: string;
    text: string;
    isCorrect: boolean;
}

interface QuestionItem {
    order: number;
    question: {
        text: string;
        type: string;
        timeLimit: number;
        points: number;
        options: Option[];
    };
}

interface QuizDetail {
    title: string;
    description: string;
    quizQuestions: QuestionItem[];
}

export const QuizDetailsModal = ({
    quizId,
    onClose,
}: {
    quizId: string | null;
    onClose: () => void;
}) => {
    const [quiz, setQuiz] = useState<QuizDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!quizId) return;

        const fetchDetails = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/api/quiz/${quizId}`);
                setQuiz(res.data);
            } catch (err) {
                alert("Failed to load quiz details");
                onClose();
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [quizId]);

    if (!quizId) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
                    <div>
                        <h2 className="text-xl font-bold text-white">
                            {quiz?.title || "Quiz Preview"}
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                            {quiz?.quizQuestions?.length || 0} Questions Total
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white text-lg cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {/* Questions List */}
                <div className="p-6 overflow-y-auto space-y-6">
                    {loading ? (
                        <div className="text-center py-10 text-slate-400">
                            Loading questions...
                        </div>
                    ) : (
                        quiz?.quizQuestions.map(({ order, question }) => (
                            <div
                                key={order}
                                className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className="font-semibold text-white text-sm">
                                        <span className="text-indigo-400 font-bold mr-2">
                                            Q{order}.
                                        </span>
                                        {question.text}
                                    </h4>
                                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                                        ⏱️ {question.timeLimit}s
                                    </span>
                                </div>

                                {/* Options */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                    {question.options.map((opt) => (
                                        <div
                                            key={opt.id}
                                            className={`px-3 py-2 rounded-lg text-xs font-medium border flex justify-between items-center ${
                                                opt.isCorrect
                                                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                                                    : "bg-slate-900 border-slate-800 text-slate-400"
                                            }`}
                                        >
                                            <span>{opt.text}</span>
                                            {opt.isCorrect && (
                                                <span className="text-emerald-400 font-bold">
                                                    ✓
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-900/60">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-xl transition cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};