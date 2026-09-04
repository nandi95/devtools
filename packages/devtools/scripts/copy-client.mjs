// Copy the generated client SPA into the `@nuxt/devtools-assets` package and
// make it mount-path portable, so devframe can serve the directory verbatim
// at any base (a local install, the on-disk cache, or its CDN back-proxy) —
// see https://devfra.me/guide/client-assets.html.
import { cpSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SOURCE = 'client/.output/public'
const TARGET = '../devtools-assets/dist'

// The client is generated with the `/__NUXT_DEVTOOLS_BASE__/` placeholder as
// its base URL (see `client/nuxt.config.ts` — Nuxt cannot generate with a
// relative base directly). Rewrite each HTML shell so it works at any mount
// point:
//
// 1. The inline runtime config's `app` object gets a `baseURL` set to a
//    `location`-derived expression (Nuxt no longer serializes `baseURL` into
//    the prerendered shell's `window.__NUXT__.config.app` at all — it's read
//    at runtime, just never populated for a static `ssr:false` generate — so
//    this injects it rather than rewriting an existing value). The client
//    uses hash routing in production, so `location.pathname` is always the
//    mount path (possibly ending in `index.html`, hence stripping the
//    trailing filename).
// 2. Every other placeholder occurrence (asset `href`/`src`, importmap)
//    becomes `./`, relative to the document — which, per 1., is always the
//    mount root.
const PLACEHOLDER = '/__NUXT_DEVTOOLS_BASE__/'
const RUNTIME_CONFIG_APP_RE = /(window\.__NUXT__\.config\s*=\s*\{[\s\S]*?\bapp:\{)([^}]*)(\})/
const RUNTIME_CONFIG_BASE_URL = 'location.pathname.replace(/[^/]*$/,"")'

rmSync(TARGET, { recursive: true, force: true })
cpSync(SOURCE, TARGET, { recursive: true })

const htmlFiles = readdirSync(TARGET).filter(file => file.endsWith('.html'))
if (htmlFiles.length === 0)
  throw new Error(`No HTML shell found in ${TARGET} — did \`nuxi generate client\` run?`)

for (const file of htmlFiles) {
  const path = join(TARGET, file)
  let html = readFileSync(path, 'utf-8')
  if (!RUNTIME_CONFIG_APP_RE.test(html))
    throw new Error(`Expected to find \`window.__NUXT__.config\`'s \`app: {...}\` object in ${file} — Nuxt's serialization may have changed; update copy-client.mjs.`)
  // Order matters: inject the runtime-config baseURL first, then rewrite the
  // remaining (asset URL) placeholder occurrences.
  html = html.replace(RUNTIME_CONFIG_APP_RE, (_, prefix, existingProps, suffix) => {
    const baseUrlProp = `baseURL:${RUNTIME_CONFIG_BASE_URL}`
    return `${prefix}${existingProps ? `${baseUrlProp},${existingProps}` : baseUrlProp}${suffix}`
  })
  html = html.replaceAll(PLACEHOLDER, './')
  writeFileSync(path, html)
}
