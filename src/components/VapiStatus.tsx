import { useState } from "react";
import { AxiosError } from "axios";
import { syncTenantVapi } from "../api/tenants";
import type { Tenant } from "../api/types";
import { IconRefresh } from "./icons";
import { Alert, Button, Card, CardBody, CardHeader, StatusText } from "./ui";

/**
 * Bu biznesin Vapi assistant-inin veziyyeti.
 *
 * Burada olmasinin sebebi: assistant qurulmayibsa biznes zeng qebul etmir, amma
 * hec bir xeta cixmir — panel normal gorunur, sadece telefon cavabsiz qalir.
 */
export function VapiStatus({
  tenant,
  onSynced,
}: {
  tenant: Tenant;
  onSynced: (updated: Tenant) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const ready = Boolean(tenant.vapiAssistantId);

  const sync = async () => {
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      onSynced(await syncTenantVapi(tenant.id));
      setDone(true);
    } catch (e) {
      const err = e as AxiosError<{ detail?: string }>;
      setError(err.response?.data?.detail ?? "Vapi ilə sinxronizasiya alınmadı.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader
        title="Telefon agenti"
        description="Salamlama, səs və nitq tanıma ayarları Vapi-yə buradan göndərilir."
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={IconRefresh}
            loading={busy}
            onClick={sync}
          >
            {ready ? "Yenidən göndər" : "Qur"}
          </Button>
        }
      />
      <CardBody>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-sm text-fg">Vəziyyət</span>
          <StatusText tone={ready ? "ok" : "err"}>
            {ready ? "qurulub" : "qurulmayıb"}
          </StatusText>
          {ready && (
            <span className="font-mono text-xs text-fg-faint">
              {tenant.vapiAssistantId}
            </span>
          )}
        </div>

        {!ready && (
          <div className="mt-4">
            <Alert tone="err" title="Bu biznes zəng qəbul etmir">
              Vapi-də agent qurulmayıb. "Qur" düyməsini bas — salamlama mətni, səs və
              bu biznesin öz nitq lüğəti avtomatik yerləşdiriləcək.
            </Alert>
          </div>
        )}

        {error && (
          <p className="mt-3 text-sm text-err">{error}</p>
        )}
        {done && !error && (
          <p className="mt-3 text-sm text-fg-muted">Vapi yeniləndi.</p>
        )}

        <p className="mt-4 border-t border-border pt-3 text-xs text-fg-faint">
          Salamlama və ya nitq lüğəti dəyişdirildikdə bu, avtomatik göndərilir.
          Düyməyə yalnız nəsə sınanda ehtiyac var.
        </p>
      </CardBody>
    </Card>
  );
}
