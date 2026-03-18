import { LegalDocumentPage } from "@/features/legal/components/LegalDocumentPage";
import { termsDocument } from "@/features/legal/lib/documents";

export default function TermsPage() {
  return <LegalDocumentPage document={termsDocument} />;
}
