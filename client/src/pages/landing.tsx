import { useNavigate } from "react-router-dom";

export const LandingPage = () => {
    const navigate = useNavigate();

    const features = [
        {
            icon: "⚡",
            title: "Real-Time Multiplayer",
            desc: "Host live quiz sessions with hundreds of players joining instantly via a room PIN.",
        },
        {
            icon: "🤖",
            title: "AI Quiz Generator",
            desc: "Generate full quizzes in seconds using Groq AI — just type a topic and go.",
        },
        {
            icon: "📊",
            title: "Live Leaderboard",
            desc: "Speed-based scoring keeps every player on edge. Watch the rankings shift in real time.",
        },
        {
            icon: "✅",
            title: "Answer Review",
            desc: "After the game, every participant can see what they answered vs the correct answer.",
        },
        {
            icon: "🎨",
            title: "MCQ, True/False & Multi-Select",
            desc: "Create diverse question types to keep your quizzes fresh and engaging.",
        },
        {
            icon: "☁️",
            title: "Auto-Save Drafts",
            desc: "Never lose your work. Quizzes save automatically as you build them.",
        },
    ];

    const steps = [
        { step: "01", title: "Create a Quiz", desc: "Build your quiz manually or generate one with AI in seconds." },
        { step: "02", title: "Host a Session", desc: "Click Host Live to get a room PIN and share it with your players." },
        { step: "03", title: "Play Together", desc: "Players join via the PIN and answer questions in real time." },
        { step: "04", title: "See the Results", desc: "View the leaderboard and your personal answer review at the end." },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* ── Navbar ── */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <span className="text-2xl font-black tracking-tight">
                        Quiz<span className="text-indigo-400">fy</span>
                    </span>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate("/login")}
                            className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition cursor-pointer"
                        >
                            Log In
                        </button>
                        <button
                            onClick={() => navigate("/signup")}
                            className="px-4 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 rounded-xl transition cursor-pointer"
                        >
                            Sign Up Free
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className="pt-32 pb-20 px-6 text-center relative overflow-hidden">
                {/* Background glow blobs */}
                <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-40 right-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative max-w-4xl mx-auto">
                    <span className="inline-block px-4 py-1.5 text-xs font-bold bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-full mb-6 uppercase tracking-wider">
                        🎉 Real-time Quiz Platform
                    </span>
                    <h1 className="text-5xl sm:text-7xl font-black leading-tight mb-6">
                        Make Learning{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                            Addictive
                        </span>
                    </h1>
                    <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Host live multiplayer quizzes, generate questions with AI, and keep your audience
                        hooked with real-time leaderboards and speed scoring.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button
                            onClick={() => navigate("/signup")}
                            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg rounded-2xl shadow-xl shadow-indigo-500/20 transition-all hover:scale-105 cursor-pointer"
                        >
                            Get Started Free →
                        </button>
                        <button
                            onClick={() => navigate("/login")}
                            className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-lg rounded-2xl border border-slate-700 transition cursor-pointer"
                        >
                            Log In
                        </button>
                    </div>

                    {/* Mock scoreboard preview */}
                    <div className="mt-16 mx-auto max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl shadow-indigo-500/5 text-left">
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-4">🏆 Live Leaderboard</p>
                        {[
                            { rank: "👑", name: "Raiya", pts: "9,450", color: "text-amber-400" },
                            { rank: "🥈", name: "Alex", pts: "7,200", color: "text-slate-300" },
                            { rank: "🥉", name: "Sam", pts: "5,800", color: "text-slate-300" },
                        ].map((p) => (
                            <div key={p.name} className="flex justify-between items-center py-2.5 border-b border-slate-800 last:border-0">
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{p.rank}</span>
                                    <span className="font-bold text-white">{p.name}</span>
                                </div>
                                <span className={`font-mono font-black text-sm ${p.color}`}>{p.pts} pts</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Features ── */}
            <section className="py-20 px-6 bg-slate-900/40">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl sm:text-4xl font-black mb-3">Everything you need</h2>
                        <p className="text-slate-400 text-lg">Built for teachers, trainers, and anyone who loves a good quiz.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((f) => (
                            <div
                                key={f.title}
                                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/40 hover:bg-slate-800/60 transition-all"
                            >
                                <span className="text-4xl mb-4 block">{f.icon}</span>
                                <h3 className="text-lg font-black text-white mb-2">{f.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── How it works ── */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl sm:text-4xl font-black mb-3">How it works</h2>
                        <p className="text-slate-400 text-lg">From zero to live quiz in under a minute.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {steps.map((s) => (
                            <div key={s.step} className="flex gap-5 items-start bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                <span className="text-3xl font-black text-indigo-500/40 font-mono shrink-0">{s.step}</span>
                                <div>
                                    <h3 className="text-base font-black text-white mb-1">{s.title}</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA Banner ── */}
            <section className="py-20 px-6">
                <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-slate-900 border border-indigo-500/20 rounded-3xl p-12">
                    <h2 className="text-3xl sm:text-5xl font-black mb-4">
                        Ready to host your first quiz?
                    </h2>
                    <p className="text-slate-400 text-lg mb-8">Free to use. No credit card required.</p>
                    <button
                        onClick={() => navigate("/signup")}
                        className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg rounded-2xl shadow-xl shadow-indigo-500/20 transition-all hover:scale-105 cursor-pointer"
                    >
                        Start for Free →
                    </button>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="border-t border-slate-800 py-8 px-6 text-center text-slate-600 text-sm">
                <span className="font-black text-slate-400">Quiz<span className="text-indigo-400">fy</span></span>
                <span className="mx-3">·</span>
                Built with ❤️ using React, TypeScript & WebSockets
            </footer>
        </div>
    );
};
