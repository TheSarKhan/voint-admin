import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/auth";
import { Field } from "../components/ui";
import { btnPrimary, inputCls } from "../components/kit/styles";
import { Wordmark } from "../components/Logo";

/** E-poçtdakı linkdən gəlinir: ?token=... + yeni şifrə. */
export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Şifrə ən azı 8 simvol olmalıdır.");
      return;
    }
    if (password !== confirm) {
      setError("Şifrələr uyğun gəlmir.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await resetPassword(token, password);
      setDone(true);
      // Bir neçə saniyə sonra girişə: istifadəçi mesajı oxusun.
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setError(detail ?? "Şifrə dəyişdirilə bilmədi. Linkin vaxtı bitmiş ola bilər.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <h1 className="mb-2.5">
            <Wordmark size="2.9rem" />
          </h1>
          <p className="text-sm text-fg-muted">Admin Panel</p>
        </div>

        {!token ? (
          <div className="space-y-4 rounded-lg border border-border bg-surface p-6 text-center">
            <p className="text-sm text-err">Link etibarsızdır — token tapılmadı.</p>
            <Link to="/forgot-password" className="inline-block text-sm text-fg-muted hover:text-fg">
              Yenidən link istə
            </Link>
          </div>
        ) : done ? (
          <div className="space-y-3 rounded-lg border border-border bg-surface p-6 text-center">
            <p className="text-sm text-fg">Şifrəniz dəyişdirildi.</p>
            <p className="text-xs text-fg-faint">Giriş səhifəsinə yönləndirilirsiniz…</p>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="space-y-4 rounded-lg border border-border bg-surface p-6"
          >
            <p className="text-sm text-fg-muted">Yeni şifrənizi təyin edin.</p>
            <Field label="Yeni şifrə">
              <input
                type="password"
                required
                autoComplete="new-password"
                className={inputCls}
                placeholder="••••••••"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
              />
            </Field>
            <Field label="Yeni şifrə (təkrar)">
              <input
                type="password"
                required
                autoComplete="new-password"
                className={inputCls}
                placeholder="••••••••"
                value={confirm}
                onChange={(ev) => setConfirm(ev.target.value)}
              />
            </Field>

            {error && (
              <p className="rounded-md border border-err/40 bg-err/10 px-3 py-2 text-sm text-err">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className={`${btnPrimary} w-full justify-center`}>
              {loading ? "Dəyişdirilir…" : "Şifrəni dəyiş"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
