import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { LOCAL_BLOG_ADMIN_API_PREFIX } from './src/lib/localBlogAdminConfig'

interface LocalizedContent {
  zh: string
  en: string
  [key: string]: string
}

interface LocalBlogCategory {
  id: string
  label: LocalizedContent
  description: LocalizedContent
}

interface LocalBlogCollection {
  slug: string
  name: LocalizedContent
  description: LocalizedContent
}

interface LocalBlogArticle {
  slug: string
  date: string
  tags: string[]
  title: LocalizedContent
  summary: LocalizedContent
  readingTime: LocalizedContent
  category: string
  collection?: string
  seriesOrder?: number
  featuredRank?: number
}

interface LocalBlogIndex {
  tags: string[]
  categories: LocalBlogCategory[]
  collections: LocalBlogCollection[]
  articles: LocalBlogArticle[]
}

interface ImportedDirectoryFile {
  relativePath: string
  contentBase64: string
}

const ROOT_DIR = fileURLToPath(new URL('.', import.meta.url))
const BLOG_ROOT_DIR = path.join(ROOT_DIR, 'public', 'blog')
const BLOG_INDEX_PATH = path.join(BLOG_ROOT_DIR, 'index.json')
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])
const LOCAL_REMOTE_ADDRESSES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])

function sortUniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right)
  )
}

function sortArticles(articles: LocalBlogArticle[]) {
  return [...articles].sort((left, right) => {
    const dateDiff = new Date(right.date).getTime() - new Date(left.date).getTime()
    if (dateDiff !== 0) {
      return dateDiff
    }

    if (left.collection && right.collection && left.collection === right.collection) {
      return (left.seriesOrder ?? Number.MAX_SAFE_INTEGER) - (right.seriesOrder ?? Number.MAX_SAFE_INTEGER)
    }

    return left.slug.localeCompare(right.slug)
  })
}

function normalizeBlogIndex(index: Partial<LocalBlogIndex>): LocalBlogIndex {
  const articles = sortArticles(index.articles ?? [])
  const tags = sortUniqueStrings([...(index.tags ?? []), ...articles.flatMap((article) => article.tags ?? [])])

  return {
    tags,
    categories: [...(index.categories ?? [])],
    collections: [...(index.collections ?? [])],
    articles,
  }
}

function isLocalRequest(req: { headers: { host?: string | undefined }; socket: { remoteAddress?: string | undefined } }) {
  const host = req.headers.host?.split(':')[0] ?? ''
  const remoteAddress = req.socket.remoteAddress ?? ''
  return LOCAL_HOSTS.has(host) && LOCAL_REMOTE_ADDRESSES.has(remoteAddress)
}

function sendJson(res: { statusCode: number; setHeader: (name: string, value: string) => void; end: (body: string) => void }, statusCode: number, payload: unknown) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

async function readJsonBody<T>(req: AsyncIterable<Buffer | string>) {
  const chunks: Buffer[] = []

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  if (chunks.length === 0) {
    return {} as T
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as T
}

function assertValidSlug(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('Slug 只能包含小写字母、数字和连字符')
  }
}

function sanitizeImportedRelativePath(relativePath: string) {
  const normalizedInput = relativePath.replace(/\\/g, '/')
  const relativeSegments = normalizedInput.split('/').slice(1)
  const normalizedPath = path.posix.normalize(relativeSegments.join('/'))

  if (
    !normalizedPath ||
    normalizedPath === '.' ||
    normalizedPath.startsWith('../') ||
    normalizedPath.includes('/../') ||
    path.posix.isAbsolute(normalizedPath)
  ) {
    throw new Error(`非法文件路径: ${relativePath}`)
  }

  return normalizedPath
}

async function readBlogIndex() {
  const raw = await fs.readFile(BLOG_INDEX_PATH, 'utf8')
  return normalizeBlogIndex(JSON.parse(raw) as LocalBlogIndex)
}

async function writeBlogIndex(index: Partial<LocalBlogIndex>) {
  const normalizedIndex = normalizeBlogIndex(index)
  await fs.writeFile(BLOG_INDEX_PATH, `${JSON.stringify(normalizedIndex, null, 2)}\n`, 'utf8')
  return normalizedIndex
}

async function importArticleDirectory(slug: string, files: ImportedDirectoryFile[], overwriteFolder: boolean) {
  const targetDirectory = path.join(BLOG_ROOT_DIR, slug)

  if (overwriteFolder) {
    await fs.rm(targetDirectory, { recursive: true, force: true })
  }

  await fs.mkdir(targetDirectory, { recursive: true })

  for (const file of files) {
    const safeRelativePath = sanitizeImportedRelativePath(file.relativePath)
    const outputPath = path.join(targetDirectory, safeRelativePath)

    if (!outputPath.startsWith(targetDirectory)) {
      throw new Error(`非法输出路径: ${file.relativePath}`)
    }

    await fs.mkdir(path.dirname(outputPath), { recursive: true })
    await fs.writeFile(outputPath, Buffer.from(file.contentBase64, 'base64'))
  }
}

function localBlogAdminPlugin(): Plugin {
  return {
    name: 'local-blog-admin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith(LOCAL_BLOG_ADMIN_API_PREFIX)) {
          next()
          return
        }

        if (!isLocalRequest(req)) {
          sendJson(res, 403, { error: '仅允许本地 localhost 访问博客管理接口' })
          return
        }

        const requestUrl = new URL(req.url, 'http://localhost')

        try {
          if (req.method === 'GET' && requestUrl.pathname === `${LOCAL_BLOG_ADMIN_API_PREFIX}/state`) {
            const index = await readBlogIndex()
            sendJson(res, 200, { index })
            return
          }

          if (req.method === 'PUT' && requestUrl.pathname === `${LOCAL_BLOG_ADMIN_API_PREFIX}/index`) {
            const body = await readJsonBody<{ index: LocalBlogIndex }>(req)
            const index = await writeBlogIndex(body.index)
            sendJson(res, 200, { index })
            return
          }

          if (req.method === 'POST' && requestUrl.pathname === `${LOCAL_BLOG_ADMIN_API_PREFIX}/import-article`) {
            const body = await readJsonBody<{
              index: LocalBlogIndex
              article: LocalBlogArticle
              files: ImportedDirectoryFile[]
              overwriteFolder?: boolean
            }>(req)

            assertValidSlug(body.article.slug)
            await importArticleDirectory(body.article.slug, body.files ?? [], Boolean(body.overwriteFolder))

            const mergedIndex = normalizeBlogIndex({
              ...body.index,
              articles: body.index.articles.some((article) => article.slug === body.article.slug)
                ? body.index.articles.map((article) => (article.slug === body.article.slug ? body.article : article))
                : [...body.index.articles, body.article],
            })

            const index = await writeBlogIndex(mergedIndex)
            sendJson(res, 200, { index })
            return
          }

          if (req.method === 'DELETE' && requestUrl.pathname.startsWith(`${LOCAL_BLOG_ADMIN_API_PREFIX}/article/`)) {
            const slug = decodeURIComponent(requestUrl.pathname.replace(`${LOCAL_BLOG_ADMIN_API_PREFIX}/article/`, ''))
            assertValidSlug(slug)

            const currentIndex = await readBlogIndex()
            const nextIndex = normalizeBlogIndex({
              ...currentIndex,
              articles: currentIndex.articles.filter((article) => article.slug !== slug),
            })

            await fs.rm(path.join(BLOG_ROOT_DIR, slug), { recursive: true, force: true })
            const index = await writeBlogIndex(nextIndex)
            sendJson(res, 200, { index })
            return
          }

          sendJson(res, 404, { error: '未找到本地博客管理接口' })
        } catch (error) {
          const message = error instanceof Error ? error.message : '本地博客管理接口执行失败'
          server.config.logger.error(message)
          sendJson(res, 500, { error: message })
        }
      })
    },
  }
}

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    tailwindcss(),
    ...(command === 'serve' ? [localBlogAdminPlugin()] : []),
  ],
  base: '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }

          if (
            id.includes('rehype-highlight') ||
            id.includes('/highlight.js/')
          ) {
            return 'highlight-vendor'
          }

          if (
            id.includes('react-markdown') ||
            id.includes('remark-gfm') ||
            id.includes('remark-math') ||
            id.includes('rehype-katex') ||
            id.includes('katex') ||
            id.includes('mdast-util-') ||
            id.includes('micromark') ||
            id.includes('unist-util-') ||
            id.includes('hast-util-')
          ) {
            return 'markdown-vendor'
          }

          if (id.includes('react-router')) {
            return 'router-vendor'
          }

          if (id.includes('react-i18next') || id.includes('i18next')) {
            return 'i18n-vendor'
          }

          if (id.includes('motion')) {
            return 'motion-vendor'
          }

          if (id.includes('lucide-react')) {
            return 'icon-vendor'
          }

          if (id.includes('/react/') || id.includes('/react-dom/')) {
            return 'react-vendor'
          }

          return undefined
        },
      },
    },
  },
}))
