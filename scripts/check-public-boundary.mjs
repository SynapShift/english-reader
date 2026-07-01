import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()

const skippedDirectories = new Set(['.git', 'dist', 'node_modules'])
const scannedExtensions = new Set([
  '.css',
  '.env',
  '.example',
  '.html',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.ts',
  '.tsx',
  '.txt',
  '',
])

const forbiddenPathParts = [
  /(^|\/)admin(\/|$)/i,
  /(^|\/)api-private(\/|$)/i,
  /(^|\/)db(\/|$)/i,
  /(^|\/)migrations(\/|$)/i,
  /(^|\/)worker(s)?(\/|$)/i,
]

const forbiddenContent = [
  /DATABASE_URL\s*=/i,
  /DIRECT_URL\s*=/i,
  /JWT_SECRET\s*=/i,
  /R2_(ACCESS|SECRET|TOKEN|KEY)/i,
  /AWS_(ACCESS_KEY_ID|SECRET_ACCESS_KEY|SESSION_TOKEN)\s*=/i,
  /CLOUDFLARE_API_TOKEN\s*=/i,
  /SUPABASE_(SERVICE_ROLE|JWT_SECRET)/i,
  /NEON_(API_KEY|DATABASE_URL)/i,
  /private_key/i,
  /wrangler\s+secret/i,
]

const allowedContentFiles = new Set([
  'docs/cloudflare-pages.md',
  'docs/public-private-boundary.md',
  'scripts/check-public-boundary.mjs',
])

async function walk(directory) {
  const entries = await readdir(directory)
  const files = []

  for (const entry of entries) {
    const absolute = path.join(directory, entry)
    const relative = path.relative(root, absolute)
    const entryStat = await stat(absolute)

    if (entryStat.isDirectory()) {
      if (!skippedDirectories.has(entry)) {
        files.push(...(await walk(absolute)))
      }
      continue
    }

    files.push(relative)
  }

  return files
}

function isScannable(file) {
  return scannedExtensions.has(path.extname(file))
}

const files = await walk(root)
const failures = []

for (const file of files) {
  const normalized = file.split(path.sep).join('/')

  for (const pattern of forbiddenPathParts) {
    if (pattern.test(normalized)) {
      failures.push(`${normalized}: path looks private`)
    }
  }

  if (!isScannable(normalized) || allowedContentFiles.has(normalized)) {
    continue
  }

  const content = await readFile(path.join(root, file), 'utf8')
  for (const pattern of forbiddenContent) {
    if (pattern.test(content)) {
      failures.push(`${normalized}: content matched ${pattern}`)
    }
  }
}

if (failures.length > 0) {
  console.error('Public boundary check failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('Public boundary check passed.')
