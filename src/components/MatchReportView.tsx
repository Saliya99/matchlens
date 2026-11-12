import { useMemo, useState } from 'react'
import {
  Copy,
  FileText,
  HelpCircle,
  Pencil,
  Sparkles,
  Upload,
  Zap,
} from 'lucide-react'
import type { MatchReport } from '../lib/matchEngine'
import { MatchRateGauge } from './MatchRateGauge'
import { StatusIcon } from './StatusIcon'

type SectionKey =
  | 'searchability'
  | 'hard'
  | 'soft'
  | 'recruiter'
  | 'formatting'

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-mist">
      <div
        className="h-full rounded-full bg-[#2f6fed] transition-all duration-700"
        style={{ width: `${Math.max(4, Math.min(100, value))}%` }}
      />
    </div>
  )
}

function Badge({
  children,
  tone = 'dark',
}: {
  children: React.ReactNode
  tone?: 'dark' | 'required'
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
        tone === 'required'
          ? 'bg-ink text-white'
          : 'bg-[#3d4654] text-white'
      }`}
    >
      {children}
    </span>
  )
}

export function MatchReportView({
  report,
  onRescan,
  onEdit,
}: {
  report: MatchReport
  onRescan: () => void
  onEdit: () => void
}) {
  const [section, setSection] = useState<SectionKey>('searchability')
  const [hardTab, setHardTab] = useState<'compare' | 'highlight'>('compare')
  const [softTab, setSoftTab] = useState<'compare' | 'highlight'>('compare')
  const [showAllHard, setShowAllHard] = useState(false)

  const hardVisible = useMemo(() => {
    if (showAllHard) return report.hardSkills.rows
    return report.hardSkills.rows.slice(0, 8)
  }, [report.hardSkills.rows, showAllHard])

  const softVisible = report.softSkills.rows

  function scrollTo(key: SectionKey) {
    setSection(key)
    document.getElementById(`section-${key}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  function copySkills(skills: string[]) {
    void navigator.clipboard.writeText(skills.join('\n'))
  }

  const groupedSearch = useMemo(() => {
    const map = new Map<string, typeof report.searchability.checks>()
    for (const c of report.searchability.checks) {
      const list = map.get(c.label) ?? []
      list.push(c)
      map.set(c.label, list)
    }
    return [...map.entries()]
  }, [report.searchability.checks])

  return (
    <div className="mx-auto max-w-7xl animate-fade-up">
      <header className="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate">
        <span className="font-medium text-ink">Resume scan results</span>
        <span className="text-mist">|</span>
        <span className="font-semibold text-ink">{report.scanName}</span>
        <button
          type="button"
          onClick={onEdit}
          className="rounded p-1 text-slate hover:bg-mist hover:text-ink"
          aria-label="Edit scan"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <aside className="h-fit rounded-2xl border border-mist bg-white p-5 shadow-sm lg:sticky lg:top-4">
          <p className="text-center font-display text-sm font-semibold text-ink">
            Match Rate
          </p>
          <div className="mt-2">
            <MatchRateGauge rate={report.matchRate} />
          </div>

          <div className="mt-4 space-y-2">
            <button
              type="button"
              onClick={onRescan}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2f6fed] px-3 py-2.5 text-sm font-bold text-white hover:bg-[#2563eb]"
            >
              <Upload className="h-4 w-4" />
              Upload &amp; rescan
            </button>
            <button
              type="button"
              onClick={() => scrollTo('hard')}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#2f6fed]/40 bg-white px-3 py-2.5 text-sm font-bold text-[#2f6fed] hover:bg-[#2f6fed]/5"
            >
              <Sparkles className="h-4 w-4" />
              AI Optimize
            </button>
          </div>

          <nav className="mt-6 space-y-4">
            {(
              [
                {
                  key: 'searchability' as const,
                  label: 'Searchability',
                  score: report.searchability.score,
                  issues: report.searchability.issues,
                },
                {
                  key: 'hard' as const,
                  label: 'Hard Skills',
                  score: report.hardSkills.score,
                  issues: report.hardSkills.issues,
                },
                {
                  key: 'soft' as const,
                  label: 'Soft Skills',
                  score: report.softSkills.score,
                  issues: report.softSkills.issues,
                },
                {
                  key: 'recruiter' as const,
                  label: 'Recruiter Tips',
                  score: report.recruiterTips.score,
                  issues: report.recruiterTips.issues,
                },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => scrollTo(item.key)}
                className={`block w-full text-left ${
                  section === item.key ? 'opacity-100' : 'opacity-90'
                }`}
              >
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="font-semibold text-ink">{item.label}</span>
                  <span className="text-xs text-[#2f6fed] hover:underline">
                    {item.issues} issue{item.issues === 1 ? '' : 's'} to fix
                  </span>
                </div>
                <ProgressBar value={item.score} />
              </button>
            ))}

            <button
              type="button"
              onClick={() => scrollTo('formatting')}
              className="block w-full text-left"
            >
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <span className="font-semibold text-ink">Formatting</span>
                <span className="text-xs font-medium text-slate">
                  {report.formatting.fileTypeLabel}
                </span>
              </div>
              <ProgressBar
                value={report.fileType === 'docx' ? 70 : 0}
              />
            </button>
          </nav>

          <button
            type="button"
            onClick={() => scrollTo('searchability')}
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#2f6fed] hover:underline"
          >
            <FileText className="h-4 w-4" />
            Guide me
          </button>
        </aside>

        {/* Main report */}
        <main className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-mist bg-white shadow-sm">
            <div className="border-t-4 border-[#2f6fed] px-5 py-4 sm:px-6">
              <h2 className="font-display text-xl font-bold text-ink">
                Resume Report
              </h2>
            </div>

            <div className="space-y-8 px-5 pb-8 sm:px-6">
              <div className="flex gap-3 rounded-lg border border-amber/30 bg-amber/10 px-4 py-3 text-sm text-ink">
                <Zap className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
                <p>
                  <strong>ATS tip:</strong> Add the company name and job URL when
                  you scan for a more customized report. Missing hard-skill
                  keywords are the fastest way to raise your match rate.
                </p>
              </div>

              {/* Searchability */}
              <div id="section-searchability" className="scroll-mt-6">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-2xl font-bold text-ink">
                    Searchability
                  </h3>
                  <Badge>Important</Badge>
                </div>
                <p className="max-w-3xl text-sm text-slate">
                  An Applicant Tracking System (ATS) is used by employers to
                  organize and filter job applications. Fixing red items helps
                  ensure your resume is parsed correctly.
                </p>
                <p className="mt-2 text-sm text-slate">
                  <strong className="text-ink">Tip:</strong> Fix the red Xs so
                  the ATS can find your contact details, sections, and title
                  match.
                </p>

                <div className="mt-5 divide-y divide-mist rounded-xl border border-mist">
                  {groupedSearch.map(([label, checks]) => (
                    <div
                      key={label}
                      className="grid gap-3 px-4 py-4 sm:grid-cols-[180px_1fr]"
                    >
                      <div className="flex items-start gap-1.5 text-sm font-semibold text-ink">
                        {label}
                        <HelpCircle className="mt-0.5 h-3.5 w-3.5 text-slate/50" />
                      </div>
                      <ul className="space-y-2.5">
                        {checks.map((c) => (
                          <li key={c.id} className="flex gap-2.5 text-sm">
                            <StatusIcon status={c.status} />
                            <span className="text-ink/90 leading-snug">
                              {c.detail}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hard skills */}
              <div id="section-hard" className="scroll-mt-6">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-2xl font-bold text-ink">
                    Hard skills
                  </h3>
                  <Badge>High score impact</Badge>
                </div>
                <p className="max-w-3xl text-sm text-slate">
                  Hard skills are specific, teachable abilities — languages,
                  frameworks, tools, and platforms. ATS systems heavily weight
                  exact keyword matches here.
                </p>
                <p className="mt-2 text-sm text-slate">
                  <strong className="text-ink">Tip:</strong> Mirror the job’s
                  spelling (e.g. JavaScript vs Javascript) and prioritize
                  required skills first.
                </p>

                {report.hardSkills.boostPotential > 0 && (
                  <div className="mt-4 overflow-hidden rounded-xl border border-mist">
                    <div className="bg-[#e8f1ff] px-4 py-3">
                      <p className="font-semibold text-ink">
                        Boost your match rate by{' '}
                        <span className="text-[#2f6fed]">
                          {report.hardSkills.boostPotential}%
                        </span>
                      </p>
                      <p className="text-sm text-slate">
                        Unlock hidden skills now — add missing JD keywords you
                        truly have.
                      </p>
                    </div>
                    <div className="flex justify-end bg-white px-4 py-2">
                      <button
                        type="button"
                        onClick={() => setShowAllHard(true)}
                        className="rounded-md border border-mist px-3 py-1.5 text-sm font-medium text-slate hover:bg-paper"
                      >
                        Show more
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex gap-1 border-b border-mist">
                  <button
                    type="button"
                    onClick={() => setHardTab('compare')}
                    className={`px-4 py-2 text-sm font-semibold ${
                      hardTab === 'compare'
                        ? 'border-b-2 border-[#2f6fed] text-[#2f6fed]'
                        : 'text-slate'
                    }`}
                  >
                    Skills Comparison
                  </button>
                  <button
                    type="button"
                    onClick={() => setHardTab('highlight')}
                    className={`px-4 py-2 text-sm font-semibold ${
                      hardTab === 'highlight'
                        ? 'border-b-2 border-[#2f6fed] text-[#2f6fed]'
                        : 'text-slate'
                    }`}
                  >
                    Highlighted Skills
                  </button>
                </div>

                {hardTab === 'compare' ? (
                  <SkillTable
                    rows={hardVisible}
                    onCopy={() =>
                      copySkills(report.hardSkills.rows.map((r) => r.skill))
                    }
                  />
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {report.hardSkills.rows.map((r) => (
                      <span
                        key={r.skill}
                        className={`rounded-full px-3 py-1 text-sm font-medium ${
                          r.missing
                            ? 'bg-rose/10 text-rose'
                            : 'bg-ok/10 text-ok'
                        }`}
                      >
                        {r.skill}
                        {r.missing ? ' · missing' : ` · ×${r.resumeCount}`}
                      </span>
                    ))}
                    {report.hardSkills.rows.length === 0 && (
                      <p className="text-sm text-slate">
                        No hard skills detected in the job description.
                      </p>
                    )}
                  </div>
                )}

                {!showAllHard && report.hardSkills.rows.length > 8 && (
                  <button
                    type="button"
                    onClick={() => setShowAllHard(true)}
                    className="mt-3 text-sm font-semibold text-[#2f6fed] hover:underline"
                  >
                    Show all {report.hardSkills.rows.length} skills
                  </button>
                )}
              </div>

              {/* Soft skills */}
              <div id="section-soft" className="scroll-mt-6">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-2xl font-bold text-ink">
                    Soft skills
                  </h3>
                  <Badge>Medium score impact</Badge>
                </div>
                <p className="max-w-3xl text-sm text-slate">
                  Soft skills describe how you work with others and solve
                  problems. They matter for recruiters, but hard skills usually
                  get you past the ATS first.
                </p>
                <p className="mt-2 text-sm text-slate">
                  <strong className="text-ink">Tip:</strong> Prioritize hard
                  skills to get interviews; showcase soft skills in bullets and
                  interviews.
                </p>

                <div className="mt-4 flex gap-1 border-b border-mist">
                  <button
                    type="button"
                    onClick={() => setSoftTab('compare')}
                    className={`px-4 py-2 text-sm font-semibold ${
                      softTab === 'compare'
                        ? 'border-b-2 border-[#2f6fed] text-[#2f6fed]'
                        : 'text-slate'
                    }`}
                  >
                    Skills Comparison
                  </button>
                  <button
                    type="button"
                    onClick={() => setSoftTab('highlight')}
                    className={`px-4 py-2 text-sm font-semibold ${
                      softTab === 'highlight'
                        ? 'border-b-2 border-[#2f6fed] text-[#2f6fed]'
                        : 'text-slate'
                    }`}
                  >
                    Highlighted Skills
                  </button>
                </div>

                {softTab === 'compare' ? (
                  <SkillTable
                    rows={softVisible}
                    onCopy={() =>
                      copySkills(report.softSkills.rows.map((r) => r.skill))
                    }
                  />
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {report.softSkills.rows.map((r) => (
                      <span
                        key={r.skill}
                        className={`rounded-full px-3 py-1 text-sm font-medium ${
                          r.missing
                            ? 'bg-rose/10 text-rose'
                            : 'bg-ok/10 text-ok'
                        }`}
                      >
                        {r.skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Recruiter tips */}
              <div id="section-recruiter" className="scroll-mt-6">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-2xl font-bold text-ink">
                    Recruiter tips
                  </h3>
                  <Badge>Important</Badge>
                </div>
                <div className="mt-4 divide-y divide-mist rounded-xl border border-mist">
                  {report.recruiterTips.checks.map((c) => (
                    <div
                      key={c.id}
                      className="grid gap-3 px-4 py-4 sm:grid-cols-[170px_1fr]"
                    >
                      <div className="flex items-start gap-1.5 text-sm font-semibold text-ink">
                        {c.label}
                        <HelpCircle className="mt-0.5 h-3.5 w-3.5 text-slate/50" />
                      </div>
                      <div className="flex gap-2.5 text-sm">
                        <StatusIcon status={c.status} />
                        <p className="leading-snug text-ink/90">{c.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Formatting */}
              <div id="section-formatting" className="scroll-mt-6">
                <h3 className="font-display text-2xl font-bold text-ink">
                  Formatting
                </h3>
                {report.formatting.pdfLimited && (
                  <div className="mt-3 rounded-lg border border-amber/30 bg-amber/10 px-4 py-3 text-sm text-ink">
                    Formatting analysis is limited for PDF/text pastes. For
                    deeper font and layout checks, keep a .docx master copy. In
                    the meantime, follow these ATS-safe formatting tips.
                  </div>
                )}
                <div className="mt-4 divide-y divide-mist rounded-xl border border-mist">
                  {['Font check', 'Layout', 'Page Setup'].map((group) => (
                    <div
                      key={group}
                      className="grid gap-3 px-4 py-4 sm:grid-cols-[140px_1fr]"
                    >
                      <div className="flex items-start gap-1.5 text-sm font-semibold text-ink">
                        {group}
                        <HelpCircle className="mt-0.5 h-3.5 w-3.5 text-slate/50" />
                      </div>
                      <ul className="space-y-2">
                        {report.formatting.checks
                          .filter((c) => c.label === group)
                          .map((c) => (
                            <li key={c.id} className="flex gap-2.5 text-sm">
                              <StatusIcon status="info" />
                              <span className="text-ink/90">{c.detail}</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

function SkillTable({
  rows,
  onCopy,
}: {
  rows: MatchReport['hardSkills']['rows']
  onCopy: () => void
}) {
  if (rows.length === 0) {
    return (
      <p className="mt-4 text-sm text-slate">
        No matching skills found in the job description dictionary. Try a fuller
        JD paste.
      </p>
    )
  }

  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead>
          <tr className="border-b border-mist text-slate">
            <th className="py-2 pr-3 font-semibold">
              <span className="inline-flex items-center gap-2">
                Skill
                <button
                  type="button"
                  onClick={onCopy}
                  className="rounded p-1 hover:bg-mist"
                  title="Copy all"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </span>
            </th>
            <th className="py-2 px-3 font-semibold">Resume</th>
            <th className="py-2 pl-3 font-semibold">Job Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.skill} className="border-b border-mist/80">
              <td className="py-3 pr-3 font-medium text-ink">{r.skill}</td>
              <td className="py-3 px-3">
                {r.missing ? (
                  <StatusIcon status="fail" />
                ) : (
                  <span className="font-semibold text-ink">{r.resumeCount}</span>
                )}
              </td>
              <td className="py-3 pl-3">
                <span className="inline-flex items-center gap-2 font-semibold text-ink">
                  {r.jdCount}
                  {r.required && <Badge tone="required">Required</Badge>}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}