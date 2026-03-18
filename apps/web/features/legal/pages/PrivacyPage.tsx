import { LegalDocumentPage } from "@/features/legal/components/LegalDocumentPage";
import { privacyDocument } from "@/features/legal/lib/documents";

export default function PrivacyPage() {
  return <LegalDocumentPage document={privacyDocument} />;
}
