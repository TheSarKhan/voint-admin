import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { createRagDocument, deleteRagDocument, getRagDocuments } from "../api/rag";
import type { RagDocument } from "../api/types";
import { clientPage, DataTable, type Column } from "./DataTable";
import { IconPlus, IconRefresh, IconTrash } from "./icons";
import {
  Alert,
  Button,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
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

function matchesDoc(d: RagDocument, needle: string): boolean {
  return (
    d.content.toLowerCase().includes(needle) ||
    (d.category ?? "").toLowerCase().includes(needle) ||
    (d.source ?? "").toLowerCase().includes(needle)
  );
}

function compareDoc(key: string): (a: RagDocument, b: RagDocument) => number {
  return (a, b) => {
    switch (key) {
      case "content":
        return a.content.localeCompare(b.content);
      case "category":
        return (a.category ?? "").localeCompare(b.category ?? "");
      case "source":
        return (a.source ?? "").localeCompare(b.source ?? "");
      case "createdAt":
        return a.createdAt.localeCompare(b.createdAt);
      default:
        return 0;
    }
  };
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
  const [category, setCategory] = useState("ALL");
  const [adding, setAdding] = useState(false);
  const [viewing, setViewing] = useState<RagDocument | null>(null);
  const [deleting, setDeleting] = useState<RagDocument | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  // DataTable oz sorgusunu yalniz "resetKey" deyisende tekrarlayir - kateqoriya suzgeci
  // ve teze siyahi (elave/sil/yenile) ucun ikisini burada birlesdiririk.
  const [refreshTick, setRefreshTick] = useState(0);

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
      setRefreshTick((t) => t + 1);
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
      setRefreshTick((t) => t + 1);
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

  const filtered = (docs ?? []).filter((d) => category === "ALL" || d.category === category);

  const columns: Column<RagDocument>[] = [
    {
      key: "content",
      header: "Məzmun",
      cell: (d) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setViewing(d);
          }}
          className="rounded text-left text-fg outline-none hover:underline focus-visible:ring-2 focus-visible:ring-fg-muted"
        >
          {preview(d.content)}
        </button>
      ),
    },
    {
      key: "category",
      header: "Kateqoriya",
      cell: (d) => <span className="text-fg-muted">{d.category || "—"}</span>,
    },
    {
      key: "source",
      header: "Mənbə",
      cell: (d) => <span className="text-fg-muted">{d.source || "—"}</span>,
    },
    {
      key: "createdAt",
      header: "Əlavə olunub",
      cell: (d) => <span className="text-fg-muted">{formatDateTime(d.createdAt)}</span>,
    },
    {
      header: "",
      align: "right",
      cell: (d) => (
        <div className="flex justify-end">
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
        </div>
      ),
    },
  ];

  if (error && !docs) return <Alert tone="err">{error}</Alert>;
  if (!docs) return null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-fg">Bilik bazası</h2>
          <p className="mt-1 text-xs text-fg-muted">
            {docs.length} sənəd · agent cavablarını buradan qurur
          </p>
        </div>
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
      </div>

      {error && (
        <div className="mb-4">
          <Alert tone="err">{error}</Alert>
        </div>
      )}

      <DataTable
        columns={columns}
        rowKey={(d) => d.id}
        defaultSort="createdAt"
        defaultDirection="desc"
        searchPlaceholder="Mətn, kateqoriya, mənbə"
        emptyMessage="Bilik bazası boşdur. Agent hazırda yalnız ümumi promptla danışır."
        resetKey={`${category}-${refreshTick}`}
        fetchPage={clientPage(filtered, matchesDoc, compareDoc)}
        onRowClick={(d) => setViewing(d)}
        toolbar={
          categories.length > 0 ? (
            <Select
              containerClassName="w-52"
              aria-label="Kateqoriya"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setRefreshTick((t) => t + 1);
              }}
              options={[
                { value: "ALL", label: "Bütün kateqoriyalar" },
                ...categories.map((c) => ({ value: c, label: c })),
              ]}
            />
          ) : undefined
        }
      />

      {adding && (
        <AddDocumentModal
          tenantId={tenantId}
          onClose={() => setAdding(false)}
          onCreated={(doc) => {
            setDocs((prev) => [doc, ...(prev ?? [])]);
            setRefreshTick((t) => t + 1);
          }}
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
    </div>
  );
}
