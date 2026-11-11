import { useNavigate } from "react-router-dom";
import { DottedGlowBackground } from "../components/ui/dotted-glow-background";
import { cn } from "../lib/utils";

// ── Navbar ─────────────────────────────────────────────────────────────────
const Navbar = () => {
    const navigate = useNavigate();
    return (
        <nav className="fixed top-0 left-0 right-0 z-50">
            <div className="mx-auto max-w-6xl px-6">
                <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/8 bg-black/40 px-5 py-3 backdrop-blur-xl">
                    <span className="text-xl font-black tracking-tight text-white">
                        Quiz<span className="text-indigo-400">fy</span>
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate("/login")}
                            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-400 transition hover:text-white cursor-pointer"
                        >
                            Log in
                        </button>
                        <button
                            onClick={() => navigate("/signup")}
                            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 cursor-pointer"
                        >
                            Get started
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

// ── Badge ───────────────────────────────────────────────────────────────────
const Badge = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 tracking-wide uppercase">
        {children}
    </span>
);



// ── Feature Card ─────────────────────────────────────────────────────────────
const FeatureCard = ({
    title,
    desc,
    className,
}: {
    icon: string;
    title: string;
    desc: string;
    className?: string;
}) => (
    <div
        className={cn(
            "group relative overflow-hidden rounded-2xl border border-white/6 bg-white/2 p-6 transition-all duration-300 hover:border-indigo-500/30 hover:bg-white/4",
            className
        )}
    >
        {/* subtle glow on hover */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 [background:radial-gradient(200px_circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(99,102,241,0.08),transparent)]" />
        <h3 className="mb-2 text-base font-bold text-white">{title}</h3>
        <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
    </div>
);

// ── Mock Leaderboard ─────────────────────────────────────────────────────────
const MockLeaderboard = () => {
    const players = [
        { medal: "🥇", name: "Yash", pts: "9,450", accent: "text-amber-400" },
        { medal: "🥈", name: "Alex", pts: "7,200", accent: "text-slate-300" },
        { medal: "🥉", name: "Sam", pts: "5,800", accent: "text-slate-300" },
    ];
    return (
        <div className="relative mx-auto w-full max-w-xs overflow-hidden rounded-2xl border border-white/8 bg-black/60 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl">
            {/* top bar dots */}
            <div className="mb-4 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
                <span className="ml-3 text-xs font-semibold text-slate-600">Live Leaderboard</span>
            </div>
            <div className="space-y-2">
                {players.map((p) => (
                    <div
                        key={p.name}
                        className="flex items-center justify-between rounded-xl bg-white/3 px-3 py-2.5 border border-white/4"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-lg">{p.medal}</span>
                            <span className="text-sm font-semibold text-white">{p.name}</span>
                        </div>
                        <span className={`font-mono text-sm font-bold ${p.accent}`}>{p.pts}</span>
                    </div>
                ))}
            </div>
            {/* glow under card */}
            <div className="pointer-events-none absolute -bottom-10 left-1/2 h-24 w-48 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-2xl" />
        </div>
    );
};


export const LandingPage = () => {
    const navigate = useNavigate();

    const features = [
        {  title: "Real-time Multiplayer", desc: "Hundreds of players join instantly with a room PIN. Zero lag, pure adrenaline." },
        {  title: "AI Quiz Generator", desc: "Type a topic. Get a full quiz in seconds powered by Groq AI." },
        {  title: "Speed-based Scoring", desc: "Answer fast, score higher. Live leaderboard shifts after every question." },
        { title: "Multiple Question Types", desc: "MCQ, True/False, and Multi-select. Keep your quiz from getting boring." },
        {title: "Auto-save Drafts", desc: "Build at your own pace. Everything saves automatically in the background." },
    ];

    const steps = [
        { n: "01", title: "Create", desc: "Build a quiz manually or generate one with AI." },
        { n: "02", title: "Host", desc: "Get a room PIN and share it with your players." },
        { n: "03", title: "Play", desc: "Everyone joins and answers in real time." },
        { n: "04", title: "Review", desc: "See the leaderboard and answer breakdown." },
    ];

    return (
        <div className="min-h-screen bg-[#080808] text-white antialiased">
            <Navbar />

            
            <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pb-24 pt-32 text-center overflow-hidden">
                <DottedGlowBackground
                    gap={20}
                    radius={2}
                    color="rgba(255, 255, 255, 0.2)"
                    glowColor="rgba(99, 102, 241, 0.85)"
                    opacity={0.8}
                    speedScale={0.8}
                />

                <div className="relative z-10 max-w-4xl mx-auto">
                    <Badge>Real-time Quiz Platform</Badge>

                    <h1 className="mt-6 text-5xl font-black leading-[1.08] tracking-tight sm:text-7xl">
                        Make Learning{" "}
                        <span className="relative">
                            <span className="relative z-10 bg-linear-to-br from-indigo-400 via-violet-400 to-purple-500 bg-clip-text text-transparent">
                                Addictive
                            </span>
                            {/* underline glow */}
                            <span className="absolute -bottom-1 left-0 right-0 h-px bg-linear-to-r from-transparent via-indigo-500/60 to-transparent" />
                        </span>
                    </h1>

                    <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
                        Host live multiplayer quizzes. Generate questions with AI. Keep players hooked
                        with real-time leaderboards and speed scoring.
                    </p>

                    <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                        <button
                            onClick={() => navigate("/signup")}
                            className="group relative overflow-hidden rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-bold text-white shadow-xl shadow-indigo-500/25 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/40 cursor-pointer"
                        >
                            <span className="relative z-10">Start for free →</span>
                        </button>
                        <button
                            onClick={() => navigate("/login")}
                            className="rounded-xl border border-white/8 bg-white/3 px-8 py-3.5 text-base font-semibold text-slate-300 backdrop-blur-sm transition hover:border-white/20 hover:text-white cursor-pointer"
                        >
                            Log in
                        </button>
                    </div>

                    {/* Mock UI card */}
                    <div className="mt-16">
                        <MockLeaderboard />
                    </div>
                </div>
            </section>

            

            
            <section className="px-6 py-28">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-16 text-center">
                        <Badge>Features</Badge>
                        <h2 className="mt-4 text-3xl font-black sm:text-5xl">Everything you need</h2>
                        <p className="mt-3 text-slate-500">Built for teachers, trainers, and quiz nerds.</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((f, i) => (
                            <FeatureCard icon={""} key={f.title} {...f} className={i === 0 ? "lg:col-span-2" : ""} />
                        ))}
                    </div>
                </div>
            </section>

            
            <section className="px-6 py-20">
                <div className="mx-auto max-w-4xl">
                    <div className="mb-14 text-center">
                        <Badge>How it works</Badge>
                        <h2 className="mt-4 text-3xl font-black sm:text-5xl">Quiz in 4 steps</h2>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {steps.map((s) => (
                            <div key={s.n} className="relative flex flex-col gap-3 rounded-2xl border border-white/6 bg-white/2 p-6">
                                <span className="font-mono text-4xl font-black text-white/10">{s.n}</span>
                                <h3 className="text-base font-bold text-white">{s.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            

            
            <footer className="border-t border-white/5 px-6 py-8 text-center">
                <p className="text-sm text-slate-600">
                    <span className="font-black text-slate-400">Quiz<span className="text-indigo-400">fy</span></span>
                </p>
            </footer>
        </div>
    );
};
