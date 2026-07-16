import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Car, Loader2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — AutoSite" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    // Supabase envia com hash #type=recovery&access_token=...
    // O client SDK processa automaticamente e dispara PASSWORD_RECOVERY.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Senha muito curta (mínimo 6).");
    if (password !== confirm) return toast.error("As senhas não coincidem.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Senha atualizada!");
    navigate({ to: "/dashboard" });
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
        <h1 className="font-display text-2xl font-bold text-center">Definir nova senha</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {ready
            ? "Escolha uma senha segura para sua conta."
            : "Abra este link a partir do email de recuperação."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <label className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 focus-within:border-primary">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nova senha (mínimo 6)"
              required
              minLength={6}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 focus-within:border-primary">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirmar nova senha"
              required
              minLength={6}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
          <button
            type="submit"
            disabled={loading || !ready}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-elegant transition hover:brightness-110 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar nova senha
          </button>
        </form>
      </div>
    </div>
  );
}
