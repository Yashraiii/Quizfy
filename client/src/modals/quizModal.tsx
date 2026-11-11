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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 antialiased">
            <div className="w-full max-w-xl max-h-[85vh] bg-[#0a0a0a] border border-white/8 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/1">
                    <div>
                        <h2 className="text-sm font-semibold text-neutral-100">
                            {quiz?.title || "Quiz Questions"}
                        </h2>
                        <p className="text-[11px] font-mono text-neutral-500 mt-0.5">
                            {quiz?.quizQuestions?.length || 0} Questions Total
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-neutral-500 hover:text-neutral-300 text-sm cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {/* Questions List */}
                <div className="p-5 overflow-y-auto space-y-4">
                    {loading ? (
                        <div className="text-center py-10 text-neutral-500 text-xs font-mono">
                            Loading questions...
                        </div>
                    ) : (
                        quiz?.quizQuestions.map(({ order, question }) => (
                            <div
                                key={order}
                                className="rounded-xl border border-white/6 bg-white/2 p-4"
                            >
                                <div className="flex justify-between items-start gap-2 mb-2.5">
                                    <h4 className="font-medium text-neutral-200 text-xs leading-snug">
                                        <span className="font-mono text-neutral-500 font-semibold mr-1.5">
                                            Q{order}.
                                        </span>
                                        {question.text}
                                    </h4>
                                    <span className="text-[10px] font-mono text-neutral-500 shrink-0 border border-white/6 px-2 py-0.5 rounded">
                                        {question.timeLimit}s
                                    </span>
                                </div>

                                {/* Options */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                    {question.options.map((opt) => (
                                        <div
                                            key={opt.id}
                                            className={`px-3 py-1.5 rounded-lg border text-xs flex items-center justify-between ${
                                                opt.isCorrect
                                                    ? "bg-white/6 border-white/20 text-neutral-100 font-medium"
                                                    : "bg-white/1 border-white/4 text-neutral-500"
                                            }`}
                                        >
                                            <span className="truncate">{opt.text}</span>
                                            {opt.isCorrect && (
                                                <span className="font-bold text-white ml-1">✓</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 flex justify-end bg-white/1">
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-200 bg-white/4 hover:bg-white/8 border border-white/8 rounded-xl transition cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
