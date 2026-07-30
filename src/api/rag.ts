import { http } from "./client";
import type { RagDocument, RagDocumentInput } from "./types";

// Backend (com.starsoft.voint.rag.dto.RagDocumentResponse) sahe adlari ile birebir
// ustuste dusur — adapter lazim deyil.

export async function getRagDocuments(tenantId: string): Promise<RagDocument[]> {
  const { data } = await http.get<RagDocument[]>(`/tenants/${tenantId}/rag/documents`);
  return data;
}

export async function createRagDocument(
  tenantId: string,
  input: RagDocumentInput,
): Promise<RagDocument> {
  const { data } = await http.post<RagDocument>(`/tenants/${tenantId}/rag/documents`, input);
  return data;
}

export async function deleteRagDocument(tenantId: string, docId: string): Promise<void> {
  await http.delete(`/tenants/${tenantId}/rag/documents/${docId}`);
}
