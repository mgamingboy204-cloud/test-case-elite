import type { LegalDocument } from "@/features/legal/lib/documents";

export function LegalDocumentPage({ document }: { document: LegalDocument }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-32 pointer-events-auto md:px-12">
      <h1 className="mb-12 text-4xl font-light text-foreground md:text-5xl">
        {document.title} <span className="font-semibold text-primary">{document.accent}</span>
      </h1>
      <div className="prose prose-invert prose-lg font-light leading-relaxed text-foreground/70">
        <p className="mb-6">{document.intro}</p>
        {document.sections.map((section) => (
          <div key={section.title}>
            <h2 className="mb-4 mt-12 text-2xl font-medium text-foreground">{section.title}</h2>
            <p className="mb-6">{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
