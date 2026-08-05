import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { createRagDocument, deleteRagDocument, getRagDocuments } from "../api/rag";
import type { RagDocument } from "../api/types";
import { IconDatabase, IconPlus, IconRefresh, IconSearch, IconTrash } from "./icons";
import {
  Alert,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Input,
  InlineSpinner,
  Modal,
  Select,
  Spinner,
  Table,
  TableContainer,
  TableEmpty,
  TBody,
  TD,
  TH,
  THead,
  Textarea,
  TR,
} from "./ui";
import { formatDateTime } from "../lib/format";

function errorText(e: unknown, fallback: string): string {
  const err = e as AxiosError<{ detail?: string }>;
  return err.response?.data?.detail ?? fallback;
}

/** Cədvəldə tam mətn yer tutmur; açılan pəncərədə bütöv göstərilir. */
function preview(content: string): string {
  const flat = content.replace(/\s+/g, " ").trim();
  return flat.length > 120 ? `${flat.slice(0, 120)}…` : flat;
}

function AddDocumentModal({
  tenantId,
  onClose,
  onCreated,
}: {
  tenantId: string;
  onClose: () => void;
  onCreated: (doc: RagDocument) => void;
}) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Məzmun boş ola bilməz.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const doc = await createRagDocument(tenantId, {
        content: content.trim(),
        // Boş sətir göndərmək əvəzinə sahəni ümumiyyətlə göndərmirik — backend
        // onları nullable saxlayır, boş sətir isə "kateqoriya var, adı yoxdur" deməkdir.
        category: category.trim() || undefined,
        source: source.trim() || undefined,
      });
      onCreated(doc);
      onClose();
    } catch (err) {
      setError(errorText(err, "Sənəd əlavə edilə bilmədi."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Bilik bazasına sənəd əlavə et"
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            İmtina
          </Button>
          <Button onClick={submit} loading={saving}>
            Əlavə et
          </Button>
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert tone="err">{error}</Alert>}
        <Textarea
          label="Məzmun"
          required
          rows={8}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          help="Agent bu mətni oxuyub cavab qurur. Bir sənəd bir mövzu olsun — uzun qarışıq mətn axtarışda daha zəif tapılır."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Kateqoriya"
            placeholder="qiymət, çatdırılma, iş saatları…"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <Input
            label="Mənbə"
            placeholder="sayt, müqavilə, telefon danışığı…"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            help="Məlumat sonradan yanlış çıxsa haradan gəldiyini bilmək üçün."
          />
        </div>
      </form>
    </Modal>
  );
}

export function RagTab({ tenantId }: { tenantId: string }) {
  const [docs, setDocs] = useState<RagDocument[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("ALL");
  const [adding, setAdding] = useState(false);
  const [viewing, setViewing] = useState<RagDocument | null>(null);
  const [deleting, setDeleting] = useState<RagDocument | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getRagDocuments(tenantId)
      .then((d) => {
        if (!cancelled) setDocs(d);
      })
      .catch((e) => {
        if (!cancelled) setError(errorText(e, "Bilik bazası yüklənə bilmədi."));
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const reload = async () => {
    setRefreshing(true);
    try {
      setDocs(await getRagDocuments(tenantId));
      setError(null);
    } catch (e) {
      setError(errorText(e, "Bilik bazası yüklənə bilmədi."));
    } finally {
      setRefreshing(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteRagDocument(tenantId, deleting.id);
      setDocs((prev) => (prev ?? []).filter((d) => d.id !== deleting.id));
      setDeleting(null);
      setError(null);
    } catch (e) {
      setError(errorText(e, "Sənəd silinə bilmədi."));
    } finally {
      setDeleteBusy(false);
    }
  };

  const categories = useMemo(() => {
    const set = new Set((docs ?? []).map((d) => d.category).filter(Boolean) as string[]);
    return [...set].sort();
  }, [docs]);

  const filtered = useMemo(() => {
    if (!docs) return [];
    const needle = q.trim().toLowerCase();
    return docs.filter((d) => {
      if (category !== "ALL" && d.category !== category) return false;
      if (!needle) return true;
      return (
        d.content.toLowerCase().includes(needle) ||
        (d.category ?? "").toLowerCase().includes(needle) ||
        (d.source ?? "").toLowerCase().includes(needle)
      );
    });
  }, [docs, q, category]);

  if (error && !docs) return <Alert tone="err">{error}</Alert>;
  if (!docs) return <Spinner />;

  return (
    <Card>
      <CardHeader
        title="Bilik bazası"
        description={`${docs.length} sənəd · agent cavablarını buradan qurur`}
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={IconRefresh}
              loading={refreshing}
              onClick={reload}
            >
              Yenilə
            </Button>
            <Button size="sm" icon={IconPlus} onClick={() => setAdding(true)}>
              Sənəd əlavə et
            </Button>
          </div>
        }
      />

      {docs.length > 0 && (
        <div className="flex flex-wrap items-end gap-3 px-6 pb-4">
          <Input
            containerClassName="w-64"
            icon={IconSearch}
            placeholder="Mətn, kateqoriya, mənbə"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {categories.length > 0 && (
            <Select
              containerClassName="w-52"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { value: "ALL", label: "Bütün kateqoriyalar" },
                ...categories.map((c) => ({ value: c, label: c })),
              ]}
            />
          )}
          {refreshing && <InlineSpinner />}
        </div>
      )}

      {error && (
        <div className="px-6 pb-4">
          <Alert tone="err">{error}</Alert>
        </div>
      )}

      {docs.length === 0 ? (
        <EmptyState
          icon={IconDatabase}
          title="Bilik bazası boşdur"
          message="Agent hazırda yalnız ümumi promptla danışır. Qiymət, iş saatları, xidmət şərtləri kimi məlumatları əlavə edin ki, zəngdə doğru cavab versin."
          action={
            <Button icon={IconPlus} onClick={() => setAdding(true)}>
              İlk sənədi əlavə et
            </Button>
          }
        />
      ) : (
        <TableContainer>
          <Table>
            <THead>
              <TR>
                <TH>Məzmun</TH>
                <TH>Kateqoriya</TH>
                <TH>Mənbə</TH>
                <TH>Əlavə olunub</TH>
                <TH className="w-10" />
              </TR>
            </THead>
            <TBody>
              {filtered.length === 0 ? (
                <TableEmpty colSpan={5} message="Süzgəcə uyğun sənəd tapılmadı." />
              ) : (
                filtered.map((d) => (
                  // Siçan üçün bütün sətir açır; klaviatura üçün birinci xanada əsl düymə var.
                  <TR key={d.id} className="cursor-pointer" onClick={() => setViewing(d)}>
                    <TD>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewing(d);
                        }}
                        className="rounded text-left outline-none hover:underline focus-visible:ring-2 focus-visible:ring-fg-muted"
                      >
                        {preview(d.content)}
                      </button>
                    </TD>
                    <TD>{d.category || "—"}</TD>
                    <TD>{d.source || "—"}</TD>
                    <TD>{formatDateTime(d.createdAt)}</TD>
                    <TD>
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        icon={IconTrash}
                        aria-label="Sil"
                        onClick={(e) => {
                          // Sətrin özü açılış pəncərəsini açır — silmə düyməsi onu tetiklememeli.
                          e.stopPropagation();
                          setDeleting(d);
                        }}
                      />
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </TableContainer>
      )}

      {adding && (
        <AddDocumentModal
          tenantId={tenantId}
          onClose={() => setAdding(false)}
          onCreated={(doc) => setDocs((prev) => [doc, ...(prev ?? [])])}
        />
      )}

      {viewing && (
        <Modal title="Sənəd" onClose={() => setViewing(null)} size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-fg-faint">Kateqoriya</p>
                <p className="mt-1 text-sm text-fg">{viewing.category || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-fg-faint">Mənbə</p>
                <p className="mt-1 text-sm text-fg">{viewing.source || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-fg-faint">Əlavə olunub</p>
                <p className="mt-1 text-sm text-fg">{formatDateTime(viewing.createdAt)}</p>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs text-fg-faint">Məzmun</p>
              <p className="max-h-96 overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">
                {viewing.content}
              </p>
            </div>
          </div>
        </Modal>
      )}

      {deleting && (
        <Modal
          title="Sənədi sil"
          onClose={() => setDeleting(null)}
          footer={
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setDeleting(null)}
                disabled={deleteBusy}
              >
                İmtina
              </Button>
              <Button variant="danger" loading={deleteBusy} onClick={confirmDelete}>
                Sil
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-fg-muted">
              Bu sənəd bilik bazasından silinəcək və agent bundan sonra onun məlumatını
              istifadə etməyəcək. Geri qaytarmaq mümkün deyil.
            </p>
            <p className="rounded-md bg-surface-2 p-3 text-sm text-fg-muted">
              {preview(deleting.content)}
            </p>
          </div>
        </Modal>
      )}
    </Card>
  );
}
