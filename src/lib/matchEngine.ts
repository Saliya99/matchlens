import {
  HARD_SKILLS,
  HARD_SKILL_ALIASES,
  SOFT_SKILLS,
  SOFT_SKILL_ALIASES,
} from './skills'

export type CheckStatus = 'pass' | 'fail' | 'warn' | 'info'

export interface CheckItem {
  id: string
  label: string
  status: CheckStatus
  detail: string
}

export interface SkillRow {
  skill: string
  resumeCount: number
  jdCount: number
  required: boolean
  missing: boolean
}

export interface MatchReport {
  matchRate: number
  scanName: string
  jobTitle: string
  companyName: string
  fileName: string
  fileType: 'pdf' | 'docx' | 'text'
  wordCount: number
  searchability: {
    score: number
    issues: number
    checks: CheckItem[]
  }
  hardSkills: {
    score: number
    issues: number
    rows: SkillRow[]
    boostPotential: number
  }
  softSkills: {
    score: number
    issues: number
    rows: SkillRow[]
  }
  recruiterTips: {
    score: number
    issues: number
    checks: CheckItem[]
  }
  formatting: {
    fileTypeLabel: string
    checks: CheckItem[]
    pdfLimited: boolean
  }
}

export interface ScanInput {
  resumeText: string
  jobDescription: string
  fileName?: string
  fileType?: 'pdf' | 'docx' | 'text'
  companyName?: string
  jobTitle?: string
  requiredEducation?: string
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u2019']/g, "'")
    .replace(/[^\w.+#/\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function countPhrase(haystack: string, phrase: string): number {
  const p = phrase.toLowerCase().trim()
  if (!p) return 0

  // Skills with . # + (e.g. .net, c#, ci/cd already escaped) need custom edges
  if (/[.#+/]/.test(p)) {
    const pattern = new RegExp(
      `(?:^|[^a-z0-9])${escapeRegex(p)}(?=[^a-z0-9]|$)`,
      'gi',
    )
    return haystack.match(pattern)?.length ?? 0
  }

  // Plain words / multi-word phrases: word-boundary style so excel ≠ excellence
  const pattern = new RegExp(
    `(?:^|[^a-z0-9])${escapeRegex(p)}(?=[^a-z0-9]|$)`,
    'gi',
  )
  return haystack.match(pattern)?.length ?? 0
}

function canonicalHard(skill: string): string {
  const key = skill.toLowerCase()
  return HARD_SKILL_ALIASES[key] ?? key
}

function canonicalSoft(skill: string): string {
  const key = skill.toLowerCase()
  return SOFT_SKILL_ALIASES[key] ?? key
}

function extractJobTitle(jd: string, override?: string): string {
  if (override?.trim()) return override.trim()
  const lines = jd
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  const titleLine =
    lines.find((l) =>
      /engineer|developer|designer|manager|analyst|architect|lead|scientist/i.test(
        l,
      ),
    ) ?? lines[0] ?? 'Role'
  return titleLine.slice(0, 80)
}

function extractCompany(jd: string, override?: string): string {
  if (override?.trim()) return override.trim()
  const m = jd.match(
    /(?:at|@|company[:\s]+)\s*([A-Z][A-Za-z0-9&.\- ]{1,40})/,
  )
  return m?.[1]?.trim() ?? ''
}

function detectYearsRequired(jd: string): number | null {
  const patterns = [
    /(\d+)\+?\s*(?:-|–|to)\s*(\d+)\+?\s*years?/i,
    /(\d+)\+\s*years?/i,
    /(\d+)\s*\+\s*years?/i,
    /minimum\s+(?:of\s+)?(\d+)\s*years?/i,
    /at least\s+(\d+)\s*years?/i,
  ]
  for (const p of patterns) {
    const m = jd.match(p)
    if (m) {
      if (m[2]) return Number(m[1])
      return Number(m[1])
    }
  }
  return null
}

function estimateExperienceYears(resume: string): number {
  const rangeRe =
    /(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)[a-z]*\.?\s+(\d{4})\s*[-–—to]+\s*(present|current|now|(?:jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)[a-z]*\.?\s+(\d{4}))/gi

  const months: Record<string, number> = {
    jan: 0,
    january: 0,
    feb: 1,
    february: 1,
    mar: 2,
    march: 2,
    apr: 3,
    april: 3,
    may: 4,
    jun: 5,
    june: 5,
    jul: 6,
    july: 6,
    aug: 7,
    august: 7,
    sep: 8,
    sept: 8,
    september: 8,
    oct: 9,
    october: 9,
    nov: 10,
    november: 10,
    dec: 11,
    december: 11,
  }

  let earliest = Infinity
  let latest = -Infinity
  let match: RegExpExecArray | null
  const now = new Date()

  while ((match = rangeRe.exec(resume)) !== null) {
    const startMonth = months[match[1].toLowerCase()] ?? 0
    const startYear = Number(match[2])
    const start = new Date(startYear, startMonth, 1).getTime()
    let end: number
    const endRaw = match[3].toLowerCase()
    if (/present|current|now/.test(endRaw)) {
      end = now.getTime()
    } else {
      const endMonthName = endRaw.replace(/\s+\d{4}$/, '').trim()
      const endYear = Number(match[4])
      const endMonth = months[endMonthName] ?? 0
      end = new Date(endYear, endMonth, 28).getTime()
    }
    earliest = Math.min(earliest, start)
    latest = Math.max(latest, end)
  }

  if (!Number.isFinite(earliest) || !Number.isFinite(latest)) {
    const yearMentions = resume.match(/\b(20\d{2})\b/g)
    if (!yearMentions || yearMentions.length < 2) return 0
    const years = yearMentions.map(Number)
    return Math.max(0, Math.max(...years) - Math.min(...years))
  }

  return Math.max(0, (latest - earliest) / (365.25 * 24 * 3600 * 1000))
}

function collectSkillsFromText(
  text: string,
  dictionary: string[],
  canonicalize: (s: string) => string,
): Map<string, number> {
  const norm = normalize(text)
  const found = new Map<string, number>()
  const sorted = [...dictionary].sort((a, b) => b.length - a.length)
  const claimed = new Set<string>()

  for (const skill of sorted) {
    const count = countPhrase(norm, skill)
    if (count === 0) continue
    const canon = canonicalize(skill)
    // Prefer longer phrase as display key when first seen
    if (!found.has(canon)) {
      found.set(canon, count)
      claimed.add(skill)
    } else {
      found.set(canon, Math.max(found.get(canon)!, count))
    }
  }

  // Also pick up TitleCase / ALLCAPS tech tokens from JD that look like skills
  const techTokens = text.match(
    /\b(?:[A-Z][a-z0-9+#]+(?:\.js|\.net)?|[A-Z]{2,}|\.[Nn]et)\b/g,
  )
  if (techTokens) {
    for (const t of techTokens) {
      const lower = t.toLowerCase()
      if (lower.length < 2) continue
      if (
        [
          'the',
          'and',
          'for',
          'with',
          'you',
          'our',
          'job',
          'role',
          'team',
          'will',
          'are',
          'this',
          'that',
          'from',
          'your',
          'have',
          'been',
          'work',
          'working',
          'experience',
          'about',
          'company',
          'requirements',
          'responsibilities',
          'qualifications',
          'benefits',
          'location',
          'remote',
          'full',
          'time',
          'part',
        ].includes(lower)
      ) {
        continue
      }
      // Only add if it's in our hard dictionary or looks technical
      const inDict = dictionary.some(
        (d) => canonicalize(d) === canonicalize(lower) || d === lower,
      )
      if (inDict) {
        const canon = canonicalize(lower)
        const c = countPhrase(norm, lower)
        if (c > 0) found.set(canon, Math.max(found.get(canon) ?? 0, c))
      }
    }
  }

  void claimed
  return found
}

function buildSkillRows(
  jdSkills: Map<string, number>,
  resumeText: string,
  canonicalize: (s: string) => string,
  requiredHints: string[],
  aliasMap: Record<string, string>,
): SkillRow[] {
  const resumeNorm = normalize(resumeText)
  const rows: SkillRow[] = []

  for (const [skill, jdCount] of jdSkills) {
    let resumeCount = countPhrase(resumeNorm, skill)
    for (const [alias, canon] of Object.entries(aliasMap)) {
      if (canon === skill || canonicalize(alias) === skill) {
        resumeCount = Math.max(resumeCount, countPhrase(resumeNorm, alias))
      }
    }
    // Also count the canonical label itself if aliases pointed here
    resumeCount = Math.max(resumeCount, countPhrase(resumeNorm, skill))

    const required = requiredHints.some(
      (h) => canonicalize(h) === skill || skill.includes(h.toLowerCase()),
    )

    rows.push({
      skill: formatSkillLabel(skill),
      resumeCount,
      jdCount,
      required,
      missing: resumeCount === 0,
    })
  }

  rows.sort((a, b) => {
    if (a.missing !== b.missing) return a.missing ? -1 : 1
    if (a.required !== b.required) return a.required ? -1 : 1
    return b.jdCount - a.jdCount
  })

  return rows
}

function formatSkillLabel(skill: string): string {
  const special: Record<string, string> = {
    'ci/cd': 'CI/CD',
    'c#': 'C#',
    '.net': '.NET',
    '.net core': '.NET Core',
    nodejs: 'Node.js',
    nextjs: 'Next.js',
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    mongodb: 'MongoDB',
    postgresql: 'PostgreSQL',
    aws: 'AWS',
    gcp: 'GCP',
    html5: 'HTML5',
    css3: 'CSS3',
    saas: 'SaaS',
    'full-stack': 'Full Stack',
    'work independently': 'Work Independently',
  }
  if (special[skill]) return special[skill]
  return skill
    .split(/[\s-]/)
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(' ')
}

function hasEmail(text: string): boolean {
  return /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text)
}

function hasPhone(text: string): boolean {
  return /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3}[\s.-]?\d{3,4}/.test(
    text,
  )
}

function hasLocation(text: string): boolean {
  return (
    /\b(street|st\.|avenue|ave\.|road|rd\.|lane|city|state|country|remote|sri lanka|[A-Z][a-z]+,\s*[A-Z]{2}\b|\b\d{5}\b)/i.test(
      text,
    ) || /\b(colombo|london|new york|san francisco|singapore|australia|canada|india|uk|usa|united states)\b/i.test(
      text,
    )
  )
}

function hasSection(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text))
}

function countMeasurableResults(text: string): number {
  const patterns = [
    /\d+%/g,
    /\$\d[\d,]*/g,
    /\b\d+\s*\+\s*(?:users|customers|clients|engineers|developers|people|members)/gi,
    /(?:reduced|increased|improved|saved|grew|cut|boosted|achieved|delivered)\s.{0,40}\d+/gi,
  ]
  let total = 0
  for (const p of patterns) {
    total += text.match(p)?.length ?? 0
  }
  return total
}

function hasWebPresence(text: string): boolean {
  return /https?:\/\/|linkedin\.com|github\.com|portfolio|behance|dribbble/i.test(
    text,
  ) || /\/[A-Za-z0-9_-]{3,}/.test(text)
}

function hasSummary(text: string): boolean {
  return /(?:^|\n)\s*(summary|profile|objective|about me)\b/i.test(text) ||
    text.split(/\n/).slice(0, 8).join(' ').length > 120
}

function dateFormattingOk(text: string): boolean {
  return /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{4}\s*[-–—]\s*(?:\d{4}|present)/i.test(
    text,
  )
}

function scoreFromRatio(matched: number, total: number): number {
  if (total === 0) return 100
  return Math.round((matched / total) * 100)
}

export function runMatch(input: ScanInput): MatchReport {
  const resume = input.resumeText.trim()
  const jd = input.jobDescription.trim()
  const fileName = input.fileName ?? 'resume.txt'
  const fileType = input.fileType ?? 'text'
  const jobTitle = extractJobTitle(jd, input.jobTitle)
  const companyName = extractCompany(jd, input.companyName)
  const wordCount = resume.split(/\s+/).filter(Boolean).length

  const jdHard = collectSkillsFromText(jd, HARD_SKILLS, canonicalHard)
  const jdSoft = collectSkillsFromText(jd, SOFT_SKILLS, canonicalSoft)

  // Mark required skills: those near "required" / "must have" or first-listed heavily
  const requiredHints: string[] = []
  const reqBlock = jd.match(
    /(?:required|must[- ]have|requirements)([\s\S]{0,800})/i,
  )
  if (reqBlock) {
    for (const skill of HARD_SKILLS) {
      if (countPhrase(normalize(reqBlock[1]), skill) > 0) {
        requiredHints.push(canonicalHard(skill))
      }
    }
  }

  const hardRows = buildSkillRows(
    jdHard,
    resume,
    canonicalHard,
    requiredHints,
    HARD_SKILL_ALIASES,
  )
  const softRows = buildSkillRows(
    jdSoft,
    resume,
    canonicalSoft,
    [],
    SOFT_SKILL_ALIASES,
  )

  // Searchability
  const emailOk = hasEmail(resume)
  const phoneOk = hasPhone(resume)
  const locationOk = hasLocation(resume)
  const educationSection = hasSection(resume, [
    /\beducation\b/i,
    /\bacademic\b/i,
  ])
  const experienceSection = hasSection(resume, [
    /\b(?:work )?experience\b/i,
    /\bemployment\b/i,
    /\bprofessional\b/i,
    /\bwork history\b/i,
  ])
  const titleInResume =
    countPhrase(normalize(resume), normalize(jobTitle)) > 0 ||
    jobTitle
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .some((w) => countPhrase(normalize(resume), w) > 0 && /engineer|developer|designer|manager|analyst|architect/.test(w))

  // Stricter job title: exact-ish phrase
  const exactTitle =
    countPhrase(normalize(resume), normalize(jobTitle)) > 0 ||
    /full[\s-]?stack|software developer|software engineer|product engineer/i.test(
      resume,
    ) && /full[\s-]?stack|software|product/i.test(jobTitle)

  const datesOk = dateFormattingOk(resume)
  const educationMatch = educationSection
  const pdfOk = fileType === 'pdf' || fileType === 'docx' || fileType === 'text'
  const specialChars = /[^a-zA-Z0-9._\-\s]/.test(fileName.replace(/\.[^.]+$/, ''))
  const conciseName = fileName.length <= 60

  const searchChecks: CheckItem[] = [
    {
      id: 'address',
      label: 'Contact Information',
      status: locationOk ? 'pass' : 'fail',
      detail: locationOk
        ? 'Address / location provided.'
        : 'Add a city/country or “Remote” so recruiters know where you are.',
    },
    {
      id: 'email',
      label: 'Contact Information',
      status: emailOk ? 'pass' : 'fail',
      detail: emailOk
        ? 'Email provided. Recruiters use your email to contact you for job matches.'
        : 'Add a professional email address.',
    },
    {
      id: 'phone',
      label: 'Contact Information',
      status: phoneOk ? 'pass' : 'fail',
      detail: phoneOk
        ? 'Phone number provided.'
        : 'Add a phone number with country code.',
    },
    {
      id: 'education-heading',
      label: 'Section Headings',
      status: educationSection ? 'pass' : 'fail',
      detail: educationSection
        ? 'We found an education section in your resume.'
        : 'Add a clear “Education” heading.',
    },
    {
      id: 'experience-heading',
      label: 'Section Headings',
      status: experienceSection ? 'pass' : 'fail',
      detail: experienceSection
        ? 'We found a work experience / work history section in your resume.'
        : 'Add a clear “Work Experience” or “Professional Experience” heading.',
    },
    {
      id: 'job-title',
      label: 'Job Title Match',
      status: exactTitle ? 'pass' : 'fail',
      detail: exactTitle
        ? `Your resume references a title close to “${jobTitle}”.`
        : `The job title “${jobTitle}” was not found on your resume. Include the exact title in your summary or recent role headline when accurate.`,
    },
    {
      id: 'dates',
      label: 'Date Formatting',
      status: datesOk ? 'pass' : 'fail',
      detail: datesOk
        ? 'Dates in your work experience are properly formatted.'
        : 'Use clear date ranges like “Jan 2024 – Present”.',
    },
    {
      id: 'education-match',
      label: 'Education Match',
      status: educationMatch ? 'pass' : 'warn',
      detail: educationMatch
        ? input.requiredEducation
          ? `Education noted. Required level: ${input.requiredEducation}.`
          : 'This job description did not list a required education level. Your education was still noted.'
        : 'Could not find education details on your resume.',
    },
    {
      id: 'filetype',
      label: 'File Type',
      status: pdfOk ? 'pass' : 'fail',
      detail:
        fileType === 'pdf'
          ? 'You used a .pdf file. This is the preferred file type.'
          : fileType === 'docx'
            ? 'You used a .docx file — good for deep formatting analysis.'
            : 'Text paste accepted. Upload a .pdf for a full file-type check.',
    },
    {
      id: 'filename-chars',
      label: 'File Type',
      status: specialChars ? 'fail' : 'pass',
      detail: specialChars
        ? 'Filename contains special characters. Prefer letters, numbers, dashes.'
        : 'No special characters in the filename.',
    },
    {
      id: 'filename-length',
      label: 'File Type',
      status: conciseName ? 'pass' : 'warn',
      detail: conciseName
        ? 'Filename is concise and readable.'
        : 'Shorten the filename for cleaner ATS ingestion.',
    },
  ]

  const searchFail = searchChecks.filter((c) => c.status === 'fail').length
  const searchPass = searchChecks.filter((c) => c.status === 'pass').length
  const searchScore = scoreFromRatio(searchPass, searchChecks.length)

  // Hard skills
  const hardMatched = hardRows.filter((r) => !r.missing).length
  const hardTotal = hardRows.length || 1
  const hardScore = scoreFromRatio(hardMatched, hardTotal)
  const hardIssues = hardRows.filter((r) => r.missing).length
  const boostPotential = Math.min(
    45,
    Math.round((hardIssues / hardTotal) * 40) + (exactTitle ? 0 : 5),
  )

  // Soft skills
  const softMatched = softRows.filter((r) => !r.missing).length
  const softTotal = softRows.length || 1
  const softScore = softRows.length
    ? scoreFromRatio(softMatched, softTotal)
    : 80
  const softIssues = softRows.filter((r) => r.missing).length

  // Recruiter tips
  const yearsRequired = detectYearsRequired(jd)
  const yearsHave = estimateExperienceYears(resume)
  const measurable = countMeasurableResults(resume)
  const summaryOk = hasSummary(resume)
  const webOk = hasWebPresence(resume)
  const toneOk = !/\bsynergy|go-getter|rockstar|ninja|think outside the box|results-driven guru\b/i.test(
    resume,
  )
  const wordOk = wordCount > 0 && wordCount <= 1000

  const levelOk =
    yearsRequired == null ? true : yearsHave + 0.4 >= yearsRequired

  const recruiterChecks: CheckItem[] = [
    {
      id: 'summary',
      label: 'Summary',
      status: summaryOk ? 'pass' : 'fail',
      detail: summaryOk
        ? 'We found a summary section on your resume. Good job! The summary provides a quick overview of your qualifications.'
        : 'Add a short professional summary at the top tailored to this role.',
    },
    {
      id: 'level',
      label: 'Job Level Match',
      status: levelOk ? 'pass' : 'fail',
      detail:
        yearsRequired == null
          ? 'No explicit years-of-experience requirement detected in the job description.'
          : levelOk
            ? `Your experience (~${yearsHave.toFixed(1)} yrs) meets the role’s ~${yearsRequired}+ years requirement.`
            : `Your experience (~${yearsHave.toFixed(1)} yrs) is less than the role requires (~${yearsRequired}+ years). If you are confident you can perform the job, apply with a strong summary explaining fit. Experience is often an initial screening factor.`,
    },
    {
      id: 'metrics',
      label: 'Measurable Results',
      status: measurable >= 5 ? 'pass' : measurable >= 2 ? 'warn' : 'fail',
      detail:
        measurable >= 5
          ? `We found ${measurable} mentions of measurable results. Strong impact language.`
          : `We found ${measurable} mention${measurable === 1 ? '' : 's'} of measurable results. Consider adding at least 5 specific achievements (time saved, cost reduced, users served, etc.).`,
    },
    {
      id: 'tone',
      label: 'Resume Tone',
      status: toneOk ? 'pass' : 'warn',
      detail: toneOk
        ? 'The tone of your resume is generally positive and no common cliches and buzzwords were found. Good job!'
        : 'Trim cliché buzzwords and keep language concrete and achievement-focused.',
    },
    {
      id: 'web',
      label: 'Web Presence',
      status: webOk ? 'pass' : 'warn',
      detail: webOk
        ? 'Nice — you linked to a site that builds web credibility (GitHub, LinkedIn, or portfolio).'
        : 'Add a LinkedIn and/or GitHub URL so recruiters can verify your work.',
    },
    {
      id: 'words',
      label: 'Word Count',
      status: wordOk ? 'pass' : 'warn',
      detail: `There are ${wordCount} words in your resume, which is ${wordOk ? 'under' : 'over'} the suggested 1000 word count for relevance and ease of reading.`,
    },
  ]

  const recruiterIssues = recruiterChecks.filter(
    (c) => c.status === 'fail' || c.status === 'warn',
  ).length
  const recruiterPass = recruiterChecks.filter((c) => c.status === 'pass').length
  const recruiterScore = scoreFromRatio(recruiterPass, recruiterChecks.length)

  const formattingChecks: CheckItem[] = [
    {
      id: 'font-bold',
      label: 'Font check',
      status: 'info',
      detail: 'Use bold for your name, job titles, and company names.',
    },
    {
      id: 'font-contrast',
      label: 'Font check',
      status: 'info',
      detail: 'Keep high contrast between text and background.',
    },
    {
      id: 'font-faces',
      label: 'Font check',
      status: 'info',
      detail: 'Limit the resume to 1–2 font families.',
    },
    {
      id: 'font-standard',
      label: 'Font check',
      status: 'info',
      detail: 'Prefer ATS-friendly fonts (Calibri, Arial, Garamond, Georgia).',
    },
    {
      id: 'font-size',
      label: 'Font check',
      status: 'info',
      detail: 'Keep body text around 10–12pt.',
    },
    {
      id: 'special-chars',
      label: 'Font check',
      status: 'info',
      detail: 'Avoid decorative symbols that some ATS misread.',
    },
    {
      id: 'images',
      label: 'Layout',
      status: 'info',
      detail: 'Avoid photos, icons, and charts — many ATS skip or scramble them.',
    },
    {
      id: 'tables',
      label: 'Layout',
      status: 'info',
      detail: 'Avoid tables; ATS often read cells out of order.',
    },
    {
      id: 'align',
      label: 'Layout',
      status: 'info',
      detail: 'Prefer left-aligned text over justified blocks.',
    },
    {
      id: 'headers',
      label: 'Page Setup',
      status: 'info',
      detail: 'Do not put contact info only in headers/footers.',
    },
    {
      id: 'margins',
      label: 'Page Setup',
      status: 'info',
      detail: 'Use margins between 0.5 and 1 inch.',
    },
    {
      id: 'pagesize',
      label: 'Page Setup',
      status: 'info',
      detail: 'Use standard Letter or A4 page size.',
    },
  ]

  // Weighted match rate (Jobscan-like): hard skills dominate
  const hardWeight = 0.5
  const softWeight = 0.15
  const searchWeight = 0.2
  const recruiterWeight = 0.15

  const matchRate = Math.round(
    hardScore * hardWeight +
      softScore * softWeight +
      searchScore * searchWeight +
      recruiterScore * recruiterWeight,
  )

  const scanName = companyName
    ? `${companyName} - ${jobTitle}`
    : jobTitle

  void titleInResume

  return {
    matchRate: Math.min(99, Math.max(5, matchRate)),
    scanName,
    jobTitle,
    companyName,
    fileName,
    fileType,
    wordCount,
    searchability: {
      score: searchScore,
      issues: searchFail,
      checks: searchChecks,
    },
    hardSkills: {
      score: hardScore,
      issues: hardIssues,
      rows: hardRows,
      boostPotential,
    },
    softSkills: {
      score: softScore,
      issues: softIssues,
      rows: softRows,
    },
    recruiterTips: {
      score: recruiterScore,
      issues: recruiterIssues,
      checks: recruiterChecks,
    },
    formatting: {
      fileTypeLabel: fileType.toUpperCase(),
      checks: formattingChecks,
      pdfLimited: fileType === 'pdf' || fileType === 'text',
    },
  }
}