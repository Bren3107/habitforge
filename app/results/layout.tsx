import { Suspense } from "react";

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
          <p className="text-[var(--text-secondary)]">Loading...</p>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
