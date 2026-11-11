import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { DottedGlowBackground } from "../components/ui/dotted-glow-background";
import { cn } from "../lib/utils";


const BottomGradient = () => (
    <>
        <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-linear-to-r from-transparent via-indigo-500 to-transparent" />
        <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-linear-to-r from-transparent via-indigo-400 to-transparent" />
    </>
);


const LabelInputContainer = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => (
    <div className={cn("flex flex-col space-y-2 w-full", className)}>
        {children}
    </div>
);

export const Signup = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password.length < 6) return setError("Password must be at least 6 characters.");
        if (password !== confirmPassword) return setError("Passwords do not match.");

        setLoading(true);
        try {
            const response = await api.post("/api/auth/signup", { name, email, password });
            localStorage.setItem("token", response.data.token);
            navigate("/dashboard");
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.error?.[0]?.message ||
                "Failed to create account. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#080808] flex items-center justify-center px-4 relative overflow-hidden antialiased">
            <DottedGlowBackground
                gap={20}
                radius={2}
                color="rgba(255, 255, 255, 0.2)"
                glowColor="rgba(99, 102, 241, 0.85)"
                opacity={0.75}
                speedScale={0.8}
            />

            {/* Logo top-left */}
            <div className="fixed top-6 left-8 z-50">
                <Link to="/" className="text-xl font-black text-white tracking-tight">
                    Quiz<span className="text-indigo-400">fy</span>
                </Link>
            </div>

            {/* Card */}
            <div className="relative z-10 w-full max-w-md rounded-2xl bg-black border border-white/8 p-8 shadow-[0px_0px_0px_1px_rgba(255,255,255,0.05)]">

                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-neutral-100">Create an account</h2>
                    <p className="mt-1.5 text-sm text-neutral-500">
                        Start hosting quizzes in under a minute.
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignup} className="space-y-4">
                    <LabelInputContainer>
                        <Label htmlFor="name">Your name</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </LabelInputContainer>

                    <LabelInputContainer>
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </LabelInputContainer>

                    <LabelInputContainer>
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Min 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </LabelInputContainer>

                    <LabelInputContainer>
                        <Label htmlFor="confirmPassword">Confirm password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Re-enter password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </LabelInputContainer>

                    {/* Divider */}
                    <div className="bg-linear-to-r from-transparent via-neutral-700 to-transparent h-px w-full mt-6!" />

                    <button
                        type="submit"
                        disabled={loading}
                       className="relative group/btn bg-zinc-900 hover:bg-white hover:text-black w-full text-white rounded-lg h-10 font-semibold text-sm shadow-[0px_1px_0px_0px_rgba(255,255,255,0.08)_inset] transition-colors duration-200 disabled:opacity-50 cursor-pointer flex items-center justify-center">
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            "Create account →"
                        )}
                        <BottomGradient />
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-neutral-600">
                    Already have an account?{" "}
                    <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};
