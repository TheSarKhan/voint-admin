import { useState } from "react";
import { AxiosError } from "axios";
import { answerQuestion, dismissQuestion, draftAnswer } from "../api/questions";
import type { DraftAnswer, UnansweredQuestion } from "../api/types";
import { IconCheck, IconClose, IconPlus, IconWaveform } from "./icons";
import {
  Alert,
  Button,
  Card,
  Input,
  StatusText,
  Textarea,
} from "./ui";

function errorText(e: unknown, fallback: string): string {
  const err = e as AxiosError<{ detail?: string }>;
  return err.response?.data?.detail ?? fallback;
}

/**
 * Bir cavabsız sualın həll forması.
 *
 * Ekranın bütün mənası budur: sual bilik bazasında boşluq deməkdir, və boşluq yalnız ora bir
 * sənəd düşəndə bağlanır. Ona görə forma sualın ALTINDA açılır — operator sualı gözdən itirmədən
 * cavabı yazır. Ayrıca pəncərə açsaydıq, cavab yazılarkən sual görünməz olardı.
 */
function AnswerForm({
  tenantId,
  question,
  onDone,
  onCancel,
}: {
  tenantId: string;
  question: UnansweredQuestion;
  onDone: (updated: UnansweredQuestion) => void;
  onCancel: () => void;
}) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<DraftAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fillWithAi = async () => {
    setDrafting(true);
    setError(null);
    try {
      const result = await draftAnswer(tenantId, question.id);
      setDraft(result);
      setContent(result.answer);
    } catch (e) {
      setError(errorText(e, "AI qaralaması hazırlana bilmədi."));
    } finally {
      setDrafting(false);
    }
  };

  const save = async () => {
    if (!content.trim()) {
      setError("Cavab boş ola bilməz.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await answerQuestion(tenantId, question.id, {
        content: content.trim(),
        category: category.trim() || undefined,
        // Sənədin haradan gəldiyi sonradan lazım olur: cavab səhv çıxsa, hansı zəngdən
        // yarandığını bilmək onu düzəltməyin ən qısa yoludur.
        source: "Cavabsız sualdan",
      });
      onDone(updated);
    } catch (e) {
      setError(errorText(e, "Cavab yadda saxlanıla bilmədi."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 space-y-4 border-t border-border pt-4">
      {error && <Alert tone="err">{error}</Alert>}

      <Textarea
        label="Bilik bazasına yazılacaq cavab"
        rows={5}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Müştəri bu sualı verəndə agent nə desin?"
        help="Bu mətn olduğu kimi bilik bazasına düşür və növbəti zənglərdə agentin cavabını qurur."
      />

      {/* AI-nin bilmədiyi konkret məlumatlar. Bunu göstərməsək, operator [...] işarəsini
          görməyib qaralamanı olduğu kimi saxlayar və agent boşluğu telefonda oxuyar. */}
      {draft && draft.missingFacts.length > 0 && (
        <Alert tone="warn" title="AI bunları bilmir — özünüz doldurun">
          <ul className="list-inside list-disc space-y-1 text-sm">
            {draft.missingFacts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        </Alert>
      )}

      {draft && draft.usedKnowledge.length > 0 && (
        <p className="text-xs text-fg-faint">
          Qaralama bunlara əsaslanıb: {draft.usedKnowledge.join(" · ")}
        </p>
      )}

      <Input
        label="Kateqoriya"
        placeholder="qiymət, iş saatları, çatdırılma…"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          icon={IconWaveform}
          loading={drafting}
          onClick={fillWithAi}
          disabled={saving}
        >
          AI ilə doldur
        </Button>
        <Button icon={IconCheck} loading={saving} onClick={save} disabled={drafting}>
          Təsdiqlə və bilik bazasına əlavə et
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={saving || drafting}>
          İmtina
        </Button>
        {drafting && (
          <span className="text-xs text-fg-faint">AI cavab hazırlayır…</span>
        )}
      </div>
    </div>
  );
}

function QuestionRow({
  tenantId,
  question,
  onChanged,
}: {
  tenantId: string;
  question: UnansweredQuestion;
  onChanged: (updated: UnansweredQuestion) => void;
}) {
  const [open, setOpen] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dismiss = async () => {
    setDismissing(true);
    try {
      onChanged(await dismissQuestion(tenantId, question.id));
    } catch (e) {
      setError(errorText(e, "Sual bağlana bilmədi."));
    } finally {
      setDismissing(false);
    }
  };

  if (question.status !== "OPEN") {
    return (
      <div className="border-b border-border/60 px-6 py-4 last:border-0">
        <p className="text-sm text-fg-muted">{question.question}</p>
        <p className="mt-1 text-xs">
          <StatusText tone={question.status === "ANSWERED" ? "ok" : "neutral"}>
            {question.status === "ANSWERED"
              ? "Cavab bilik bazasına əlavə olunub"
              : "Cavab lazım deyil deyə bağlanıb"}
          </StatusText>
        </p>
      </div>
    );
  }

  return (
    <div className="border-b border-border/60 px-6 py-4 last:border-0">
      <p className="text-sm text-fg">{question.question}</p>
      {question.context && (
        <p className="mt-1 text-xs text-fg-faint">{question.context}</p>
      )}
      {error && (
        <div className="mt-3">
          <Alert tone="err">{error}</Alert>
        </div>
      )}

      {!open ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" icon={IconPlus} onClick={() => setOpen(true)}>
            RAG-a sualın cavabını əlavə et
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={IconClose}
            loading={dismissing}
            onClick={dismiss}
          >
            Cavab lazım deyil
          </Button>
        </div>
      ) : (
        <AnswerForm
          tenantId={tenantId}
          question={question}
          onDone={onChanged}
          onCancel={() => setOpen(false)}
        />
      )}
    </div>
  );
}

/**
 * Zəng detalındakı "cavablanmamış suallar" bölməsi.
 *
 * Hеç bir açıq sual yoxdursa ümumiyyətlə göstərilmir — hər zəngdə boş bir qutu saxlamaq
 * ekranı doldurur və əsl boşluğu gözə çarpmaz edir.
 */
export function UnansweredQuestions({
  tenantId,
  questions,
  onChanged,
}: {
  tenantId: string;
  questions: UnansweredQuestion[];
  onChanged: (updated: UnansweredQuestion) => void;
}) {
  if (questions.length === 0) {
    return null;
  }
  const openCount = questions.filter((q) => q.status === "OPEN").length;

  return (
    <Card className="mb-6">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-sm font-semibold text-fg">Agentin cavablaya bilmədiyi suallar</h2>
        <p className="mt-1 text-xs text-fg-muted">
          {openCount > 0
            ? `${openCount} sual bilik bazasında boşluq göstərir. Cavabı əlavə etsəniz, agent növbəti zəngdə özü cavablayacaq.`
            : "Bu zəngdəki bütün suallar bağlanıb."}
        </p>
      </div>
      <div>
        {questions.map((q) => (
          <QuestionRow
            key={q.id}
            tenantId={tenantId}
            question={q}
            onChanged={onChanged}
          />
        ))}
      </div>
    </Card>
  );
}
