import { useState, useTransition } from 'react'
import { ScanForm, type ScanFormValues } from './components/ScanForm'
import { MatchReportView } from './components/MatchReportView'
import { runMatch, type MatchReport } from './lib/matchEngine'

export default function App() {
  const [report, setReport] = useState<MatchReport | null>(null)
  const [pending, startTransition] = useTransition()

  function handleScan(values: ScanFormValues) {
    startTransition(() => {
      const next = runMatch({
        resumeText: values.resumeText,
        jobDescription: values.jobDescription,
        fileName: values.fileName,
        fileType: values.fileType,
        companyName: values.companyName,
        jobTitle: values.jobTitle,
      })
      setReport(next)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  return (
    <div className="min-h-screen">
      <div className="border-b border-mist/80 bg-ink text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-teal-bright/20 font-display text-sm font-extrabold text-teal-bright">
              ML
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              MatchLens
            </span>
          </div>
          <p className="hidden text-xs text-white/60 sm:block">
            ATS-style resume ↔ job match · runs fully in your browser
          </p>
        </div>
      </div>

      <div className="mx-auto px-4 py-8 sm:px-6 sm:py-10">
        {report ? (
          <MatchReportView
            report={report}
            onRescan={() => setReport(null)}
            onEdit={() => setReport(null)}
          />
        ) : (
          <ScanForm onScan={handleScan} busy={pending} />
        )}
      </div>

      <footer className="border-t border-mist py-6 text-center text-xs text-slate">
        MatchLens mimics ATS keyword shortlisting in-browser. No resume data is
        uploaded to a server.
      </footer>
    </div>
  )
}