import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "@/assets/cyberguard-logo-final.png.asset.json";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : "/history",
  }),
  head: () => ({
    meta: [
      { title: "Sign in — CyberShield AI" },
      { name: "description", content: "Sign in to access your CyberShield AI investigation history and security reports." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect: redirectTo } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: redirectTo as "/history", replace: true });
    });
  }, [navigate, redirectTo]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setInfo(null); setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/history" },
        });
        if (error) throw error;
        setInfo("Check your inbox to confirm your email, then sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: redirectTo as "/history", replace: true });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 size-[500px] rounded-full blur-3xl opacity-20"
          style={{ background: "var(--gradient-primary)" }} />
        <div className="absolute bottom-1/4 right-1/4 size-[400px] rounded-full blur-3xl opacity-10"
          style={{ background: "var(--cyber-cyan)" }} />
      </div>

      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <img src={logoAsset.url} alt="CyberGuard Agents" className="h-9 w-auto rounded-md" />
          <span className="font-display font-semibold tracking-tight text-lg">CyberShield AI</span>
        </Link>

        <div className="glass-strong rounded-2xl p-7">
          <div className="mb-6">
            <h1 className="text-2xl font-display font-bold tracking-tight">
              {mode === "signin" ? "Welcome back, analyst" : "Create your SOC account"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "signin" ? "Sign in to access your investigation history." : "Save investigations and export forensic reports."}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Email</span>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                  placeholder="analyst@soc.io"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Password</span>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                  placeholder="••••••••"
                />
              </div>
            </label>

            {error && <p className="text-xs text-rose-300 font-mono">{error}</p>}
            {info && <p className="text-xs text-emerald-300 font-mono">{info}</p>}

            <button type="submit" disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-60"
              style={{ background: "var(--gradient-primary)", color: "white", boxShadow: "var(--shadow-glow)" }}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-muted-foreground">
            {mode === "signin" ? (
              <>No account? <button onClick={() => { setMode("signup"); setError(null); }} className="text-cyan-300 hover:underline">Create one</button></>
            ) : (
              <>Already registered? <button onClick={() => { setMode("signin"); setError(null); }} className="text-cyan-300 hover:underline">Sign in</button></>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          <Link to="/" className="hover:text-foreground">← Back to overview</Link>
        </p>
      </div>
    </div>
  );
}
