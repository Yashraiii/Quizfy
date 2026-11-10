import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

export const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await api.post("/api/auth/signin", {
                email,
                password,
            });

            // Save token to localStorage
            const token = response.data.token;
            localStorage.setItem("token", token);

            // Redirect to dashboard after successful login
            navigate("/dashboard");
        } catch (err: any) {
            setError(err.response?.data?.message || "Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-indigo-500/10">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-purple-400">
                        Quizfy
                    </h1>
                    <p className="text-slate-400 text-sm mt-2">
                        Welcome back! Please enter your details.
                    </p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Email Address
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition duration-200 flex items-center justify-center cursor-pointer"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            "Sign In"
                        )}
                    </button>
                </form>

                {/* Footer Link */}
                <p className="text-center text-sm text-slate-400 mt-6">
                    Don't have an account?{" "}
                    <Link
                        to="/signup"
                        className="text-indigo-400 hover:text-indigo-300 font-medium transition"
                    >
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
};