const {
  isAbsolute: nodeIsAbsolute,
  relative,
  resolve: nodeResolve,
} = require("node:path")

const resolve = require("eslint-module-utils/resolve.js")
const isCoreModule = require("is-core-module")

const { getContextPackagePath } = require("./package-path.cjs")

function baseModule(name) {
  if (isScoped(name)) {
    const [scope, package_] = name.split("/")
    return `${scope}/${package_}`
  }
  const [package_] = name.split("/")
  return package_
}

function isInternalRegexMatch(name, settings) {
  const internalScope = settings && settings["import/internal-regex"]
  return internalScope && new RegExp(internalScope).test(name)
}

function isAbsolute(name) {
  return typeof name === "string" && nodeIsAbsolute(name)
}

// path is defined only when a resolver resolves to a non-standard path
exports.isBuiltIn = function isBuiltIn(name, settings, path) {
  if (path || !name) return false
  const base = baseModule(name)
  const extras = (settings && settings["import/core-modules"]) || []
  return isCoreModule(base) || extras.includes(base)
}

function isExternalModule(name, path, context) {
  if (arguments.length < 3) {
    throw new TypeError(
      "isExternalModule: name, path, and context are all required",
    )
  }
  return (
    (isModule(name) || isScoped(name)) &&
    typeTest(name, context, path) === "external"
  )
}

exports.isExternalModule = function isExternalModuleMain(name, path, context) {
  if (arguments.length < 3) {
    throw new TypeError(
      "isExternalModule: name, path, and context are all required",
    )
  }
  return isModuleMain(name) && typeTest(name, context, path) === "external"
}

const moduleRegExp = /^\w/
function isModule(name) {
  return name && moduleRegExp.test(name)
}

const moduleMainRegExp = /^\w((?!\/).)*$/
function isModuleMain(name) {
  return name && moduleMainRegExp.test(name)
}

const scopedRegExp = /^@[^/]+\/?[^/]+/
function isScoped(name) {
  return name && scopedRegExp.test(name)
}
exports.isScoped = isScoped

const scopedMainRegExp = /^@[^/]+\/?[^/]+$/
function isScopedMain(name) {
  return name && scopedMainRegExp.test(name)
}

function isRelativeToParent(name) {
  return /^\.\.$|^\.\.[/\\]/.test(name)
}

const indexFiles = new Set([".", "./", "./index", "./index.js"])
function isIndex(name) {
  return indexFiles.has(name)
}

function isRelativeToSibling(name) {
  return /^\.[/\\]/.test(name)
}

function isExternalPath(path, context) {
  if (!path) {
    return false
  }

  const { settings } = context
  const packagePath = getContextPackagePath(context)

  if (relative(packagePath, path).startsWith("..")) {
    return true
  }

  const folders = (settings && settings["import/external-module-folders"]) || [
    "node_modules",
  ]
  return folders.some((folder) => {
    const folderPath = nodeResolve(packagePath, folder)
    const relativePath = relative(folderPath, path)
    return !relativePath.startsWith("..")
  })
}

function isInternalPath(path, context) {
  if (!path) {
    return false
  }
  const packagePath = getContextPackagePath(context)
  return !relative(packagePath, path).startsWith("../")
}

function isExternalLookingName(name) {
  return isModule(name) || isScoped(name)
}

function typeTest(name, context, path) {
  const { settings } = context
  if (isInternalRegexMatch(name, settings)) {
    return "internal"
  }
  if (isAbsolute(name, settings, path)) {
    return "absolute"
  }
  if (isBuiltIn(name, settings, path)) {
    return "builtin"
  }
  if (isRelativeToParent(name, settings, path)) {
    return "parent"
  }
  if (isIndex(name, settings, path)) {
    return "index"
  }
  if (isRelativeToSibling(name, settings, path)) {
    return "sibling"
  }
  if (isExternalPath(path, context)) {
    return "external"
  }
  if (isInternalPath(path, context)) {
    return "internal"
  }
  if (isExternalLookingName(name)) {
    return "external"
  }
  return "unknown"
}
