import { useRef, useState, type FormEvent } from 'react'
import { FileUp, Sparkles, Loader2 } from 'lucide-react'
import { extractTextFromPdf, isPdfFile } from '../lib/extractPdf'
import { SAMPLE_JD, SAMPLE_RESUME } from '../lib/sampleData'

export interface ScanFormValues {
  resumeText: string
  jobDescription: string
  fileName: string
  fileType: 'pdf' | 'docx' | 'text'
  companyName: string
  jobTitle: string
}

export function ScanForm({
  onScan,
  busy,
}: {
  onScan: (values: ScanFormValues) => void
  busy?: boolean
}) {
  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [fileName, setFileName] = useState('resume.txt')
  const [fileType, setFileType] = useState<'pdf' | 'docx' | 'text'>('text')
  const [companyName, setCompanyName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function onFile(file: File | null) {
    if (!file) return
    setError(null)
    setFileName(file.name)
    setParsing(true)
    try {
      if (isPdfFile(file)) {
        const text = await extractTextFromPdf(file)
        if (!text.trim()) {
          setError('Could not extract text from this PDF. Paste the resume text instead.')
          setFileType('pdf')
          return
        }
        setResumeText(text)
        setFileType('pdf')
      } else if (file.name.toLowerCase().endsWith('.txt')) {
        setResumeText(await file.text())
        setFileType('text')
      } else if (file.name.toLowerCase().endsWith('.docx')) {
        setError(
          'DOCX binary parse is not enabled in-browser yet. Paste the resume text, or upload a PDF/TXT.',
        )
        setFileType('docx')
      } else {
        setError('Upload a PDF or TXT file, or paste resume text below.')
      }
    } catch {
      setError('Failed to read that file. Try pasting the resume text.')
    } finally {
      setParsing(false)
    }
  }

  function loadSample() {
    setResumeText(SAMPLE_RESUME)
    setJobDescription(SAMPLE_JD)
    setFileName('SE_Remote.pdf')
    setFileType('pdf')
    setCompanyName('Marsello')
    setJobTitle('Full Stack Product Engineer')
    setError(null)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!resumeText.trim() || !jobDescription.trim()) {
      setError('Both resume and job description are required.')
      return
    }
    onScan({
      resumeText,
      jobDescription,
      fileName,
      fileType,
      companyName,
      jobTitle,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-teal">
            MatchLens
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            ATS Match Report
          </h1>
          <p className="mt-2 max-w-xl text-slate">
            Compare your resume to a job description the way hiring ATS software
            shortlists candidates — hard skills, soft skills, keywords, and
            recruiter checks.
          </p>
        </div>
        <button
          type="button"
          onClick={loadSample}
          className="inline-flex items-center gap-2 rounded-lg border border-teal/30 bg-white px-4 py-2.5 text-sm font-semibold text-teal shadow-sm transition hover:border-teal hover:bg-teal/5"
        >
          <Sparkles className="h-4 w-4" />
          Load sample scan
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-ink">Company (optional)</span>
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Marsello"
            className="w-full rounded-lg border border-mist bg-white px-3 py-2.5 text-ink outline-none ring-teal/30 focus:ring-2"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-ink">Job title (optional)</span>
          <input
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. Full Stack Product Engineer"
            className="w-full rounded-lg border border-mist bg-white px-3 py-2.5 text-ink outline-none ring-teal/30 focus:ring-2"
          />
        </label>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-mist bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-ink">Resume</h2>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink-soft"
            >
              {parsing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileUp className="h-3.5 w-3.5" />
              )}
              Upload PDF / TXT
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt,application/pdf,text/plain"
              className="hidden"
              onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <p className="text-xs text-slate">
            {fileName} · {fileType.toUpperCase()}
          </p>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            rows={16}
            placeholder="Paste resume text or upload a PDF…"
            className="w-full resize-y rounded-xl border border-mist bg-paper px-3 py-3 text-sm leading-relaxed text-ink outline-none ring-teal/30 focus:ring-2"
          />
        </div>

        <div className="space-y-3 rounded-2xl border border-mist bg-white p-4 shadow-sm sm:p-5">
          <h2 className="font-display text-lg font-semibold text-ink">
            Job description
          </h2>
          <p className="text-xs text-slate">
            Paste the full posting for the best keyword match.
          </p>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={16}
            placeholder="Paste the job description…"
            className="w-full resize-y rounded-xl border border-mist bg-paper px-3 py-3 text-sm leading-relaxed text-ink outline-none ring-teal/30 focus:ring-2"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose/20 bg-rose/5 px-4 py-3 text-sm text-rose">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={busy || parsing}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal px-5 py-3.5 font-display text-base font-bold text-white shadow-sm transition hover:bg-teal-bright disabled:opacity-60 sm:w-auto"
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        Run ATS match scan
      </button>
    </form>
  )
}