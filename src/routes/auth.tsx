import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Car, Loader2, Mail, Lock, User, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — AutoSite" },
      { name: "description", content: "Acesse ou crie sua conta na AutoSite." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupSentTo, setSignupSentTo] = useState<string | null>(null);

  useEffect(() => {
    // If already signed in, bounce to the app
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) navigate({ to: "/dashboard" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        setSignupSentTo(email);
        toast.success("Conta criada! Confirme pelo link enviado no seu email.", { duration: 8000 });
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Se o email existir, enviamos um link para redefinir a senha.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col items-center justify-center px-6 py-16">
      <a href="/" className="mb-8 flex items-center gap-2">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary shadow-glow">
          <Car className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-display text-xl font-bold">AutoSite</span>
      </a>

      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-elegant">
        <h1 className="font-display text-2xl font-bold text-center">
          {mode === "login" ? "Bem-vindo de volta" : mode === "signup" ? "Criar sua conta" : "Recuperar senha"}
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {mode === "login"
            ? "Acesse o painel da sua revenda."
            : mode === "signup"
              ? "Comece grátis por 7 dias."
              : "Enviaremos um link para redefinir a sua senha."}
        </p>

        {signupSentTo && (
          <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
              <div className="space-y-2">
                <p className="font-semibold text-emerald-300">Conta criada! Confirme seu email</p>
                <p className="text-muted-foreground">
                  Enviamos um link de confirmação para <span className="font-medium text-foreground">{signupSentTo}</span>.
                  Clique no link para ativar sua conta e poder entrar.
                </p>
                <p className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-2 text-amber-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    <strong>Não encontrou?</strong> Verifique a caixa de <strong>Spam</strong> ou <strong>Promoções</strong>.
                    O email pode levar alguns minutos para chegar.
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => { setSignupSentTo(null); setMode("login"); }}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Já confirmei — ir para o login
                </button>
              </div>
            </div>
          </div>
        )}

        {mode === "signup" && !signupSentTo && (
          <div className="mt-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Após criar a conta, enviaremos um <strong>email de confirmação</strong>. Se não aparecer na caixa de entrada em alguns minutos,
              verifique as pastas <strong>Spam</strong> e <strong>Promoções</strong>.
            </span>
          </div>
        )}

        <form onSubmit={handleEmail} className="mt-6 space-y-3">
          {mode === "signup" && (
            <Field icon={<User className="h-4 w-4" />} value={name} onChange={setName} placeholder="Nome completo" />
          )}
          <Field icon={<Mail className="h-4 w-4" />} type="email" value={email} onChange={setEmail} placeholder="email@revenda.com.br" required />
          {mode !== "forgot" && (
            <Field icon={<Lock className="h-4 w-4" />} type="password" value={password} onChange={setPassword} placeholder="Senha (mínimo 6 caracteres)" required minLength={6} />
          )}
          {mode === "login" && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-xs font-medium text-primary hover:underline"
              >
                Esqueci minha senha
              </button>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-elegant transition hover:brightness-110 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar link de recuperação"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "forgot" ? (
            <>
              Lembrou a senha?{" "}
              <button onClick={() => setMode("login")} className="font-medium text-primary hover:underline">
                Voltar para o login
              </button>
            </>
          ) : (
            <>
              {mode === "login" ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
              <button
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="font-medium text-primary hover:underline"
              >
                {mode === "login" ? "Criar agora" : "Entrar"}
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function Field({
  icon, type = "text", value, onChange, placeholder, required, minLength,
}: {
  icon: React.ReactNode; type?: string; value: string; onChange: (v: string) => void;
  placeholder: string; required?: boolean; minLength?: number;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 focus-within:border-primary">
      <span className="text-muted-foreground">{icon}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </label>
  );
}

