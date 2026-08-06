import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/auth";
import { Field } from "../components/ui";
import { btnPrimary, inputCls } from "../components/kit/styles";
import { Wordmark } from "../components/Logo";

/**
 * "Şifrəmi unutdum" — e-poçt daxil et, link gəlsin.
 *
 * Nəticə həmişə eynidir: backend hesabın mövcudluğunu açıqlamır, ona görə ekran da
 * "hesab varsa göndərildi" deyir. "Belə hesab yoxdur" demək bu formanı e-poçt yoxlama
 * alətinə çevirərdi.
 */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setError(detail ?? "Sorğu göndərilə bilmədi. Bir qədər sonra yenidən cəhd edin.");
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

        {sent ? (
          <div className="space-y-4 rounded-lg border border-border bg-surface p-6 text-center">
            <p className="text-sm text-fg">
              Əgər bu e-poçt üçün hesab varsa, şifrə sıfırlama linki göndərildi.
            </p>
            <p className="text-xs text-fg-faint">
              Link bir saat ərzində keçərlidir. Gəlmədisə spam qovluğuna baxın.
            </p>
            <Link to="/login" className="inline-block text-sm text-fg-muted hover:text-fg">
              Girişə qayıt
            </Link>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="space-y-4 rounded-lg border border-border bg-surface p-6"
          >
            <p className="text-sm text-fg-muted">
              Hesabınızın e-poçtunu daxil edin — şifrə sıfırlama linki göndərək.
            </p>
            <Field label="E-poçt">
              <input
                type="email"
                required
                autoComplete="email"
                className={inputCls}
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
              />
            </Field>

            {error && (
              <p className="rounded-md border border-err/40 bg-err/10 px-3 py-2 text-sm text-err">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className={`${btnPrimary} w-full justify-center`}>
              {loading ? "Göndərilir…" : "Link göndər"}
            </button>
            <Link
              to="/login"
              className="block text-center text-sm text-fg-muted hover:text-fg"
            >
              Girişə qayıt
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
