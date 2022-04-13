import fs from "node:fs"
import { dirname } from "node:path"
import { URL, fileURLToPath, pathToFileURL } from "node:url"

import { build, transformSync } from "esbuild"
import semver from "semver"

const isWindows = process.platform === "win32"

const httpRegex = /^https?:\/\//
const extensionsRegex = /\.m?(tsx?|json)$/

async function esbuildResolve(id: string, directory: string) {
  let result

  await build({
    stdin: {
      contents: `import ${JSON.stringify(id)}`,
      resolveDir: directory,
    },
    write: false,
    bundle: true,
    treeShaking: false,
    ignoreAnnotations: true,
    platform: "node",
    plugins: [
      {
        name: "resolve",
        setup({ onLoad }) {
          onLoad({ filter: /.*/ }, (arguments_) => {
            result = arguments_.path
            return { contents: "" }
          })
        },
      },
    ],
  })
  // console.log({ id, directory, result })
  return result
}

function esbuildTransformSync(
  rawSource: string,
  filename: string,
  url: string,
  format: string,
) {
  const {
    code: js,
    warnings,
    map: jsSourceMap,
  } = transformSync(rawSource.toString(), {
    sourcefile: filename,
    sourcemap: "both",
    // loader: new URL(url).pathname.match(extensionsRegex)?.[1],
    // target: `node${process.versions.node}`,
    target: `es2020`,
    format: format === "module" ? "esm" : "cjs",
  })

  if (warnings && warnings.length > 0) {
    for (const warning of warnings) {
      console.warn(warning.location)
      console.warn(warning.text)
    }
  }

  return { js, jsSourceMap }
}

function getTsCompatSpecifier(parentURL: string, specifier: string) {
  let tsSpecifier
  let search

  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    // Relative import
    const url = new URL(specifier, parentURL)
    tsSpecifier = fileURLToPath(url).replace(/\.tsx?$/, "")
    search = url.search
  } else {
    // Bare import
    tsSpecifier = specifier
    search = ""
  }

  return {
    tsSpecifier,
    search,
  }
}

function isValidURL(s) {
  try {
    return !!new URL(s)
  } catch (error) {
    if (error instanceof TypeError) return false

    throw error
  }
}

async function resolveBase(specifier: string, context, defaultResolve) {
  const { parentURL } = context

  if (httpRegex.test(specifier) || httpRegex.test(parentURL)) {
    return {
      url: new URL(specifier, parentURL).href,
      format: "module",
    }
  }

  let url

  // According to Node's algorithm, we first check if it is a valid URL.
  // When the module is the entry point, node will provides a file URL to it.
  if (isValidURL(specifier)) {
    url = new URL(specifier)
  } else {
    // Try to resolve the module according to typescript's algorithm,
    // and construct a valid url.

    const parsed = getTsCompatSpecifier(parentURL, specifier)
    const path = await esbuildResolve(
      parsed.tsSpecifier,
      dirname(fileURLToPath(parentURL)),
    )
    if (path) {
      url = pathToFileURL(path)
      url.search = parsed.search
    }
  }

  if (url) {
    // If the resolved file is typescript
    if (extensionsRegex.test(url.pathname)) {
      return {
        url: url.href,
        format: "module",
      }
    }
    // Else, for other types, use default resolve with the valid path
    return defaultResolve(url.href, context, defaultResolve)
  }

  return defaultResolve(specifier, context, defaultResolve)
}

async function loadBase(url: string, context, defaultLoad) {
  if (httpRegex.test(url)) {
    return {
      format: "module",
      source: await fetchNetworkModule(url),
    }
  }

  if (extensionsRegex.test(new URL(url).pathname)) {
    const { format } = context

    let filename = url
    if (!isWindows) filename = fileURLToPath(url)

    const rawSource = fs.readFileSync(new URL(url), { encoding: "utf8" })
    const { js } = esbuildTransformSync(rawSource, filename, url, format)

    return {
      format: "module",
      source: js,
    }
  }

  // Let Node.js handle all other format / sources.
  return defaultLoad(url, context, defaultLoad)
}

function getFormatBase(url: string, context, defaultGetFormat) {
  if (httpRegex.test(url)) {
    return {
      format: "module",
    }
  }

  if (extensionsRegex.test(new URL(url).pathname)) {
    return {
      format: "module",
    }
  }

  // Let Node.js handle all other URLs.
  return defaultGetFormat(url, context, defaultGetFormat)
}

async function transformSourceBase(
  source: string,
  context,
  defaultTransformSource,
) {
  const { url, format } = context

  if (httpRegex.test(url)) {
    return {
      format: "module",
      source: await fetchNetworkModule(url),
    }
  }

  if (extensionsRegex.test(new URL(url).pathname)) {
    let filename = url
    if (!isWindows) filename = fileURLToPath(url)

    const { js } = esbuildTransformSync(source, filename, url, format)

    return {
      source: js,
    }
  }

  // Let Node.js handle all other sources.
  return defaultTransformSource(source, context, defaultTransformSource)
}

async function getSourceBase(url: string, context, defaultGetSource) {
  if (httpRegex.test(url)) {
    return {
      source: await fetchNetworkModule(url),
    }
  }

  return defaultGetSource(url, context, defaultGetSource)
}

const networkModuleCache = new Map()

function fetchNetworkModule(url: string) {
  if (!networkModuleCache.has(url)) {
    const promise = (async () => {
      const _fetch =
        typeof fetch != "undefined"
          ? fetch
          : // eslint-disable-next-line unicorn/no-await-expression-member
            (await import("node-fetch")).default

      return await _fetch(url).then((r) => r.text())
    })()
    networkModuleCache.set(url, promise)
  }
  return networkModuleCache.get(url)
}

// New hook starting from Node v16.12.0
// See: https://github.com/nodejs/node/pull/37468
const _resolve = resolveBase
let _load, _getFormat, _transformSource, _getSource
if (semver.satisfies(process.versions.node, ">=16.12.0")) {
  _load = loadBase
} else {
  _getFormat = getFormatBase
  _transformSource = transformSourceBase
  _getSource = getSourceBase
}
export const resolve = _resolve
export const load = _load
export const getFormat = _getFormat
export const transformSource = _transformSource
export const getSource = _getSource
export { networkModuleCache }
