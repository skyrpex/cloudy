import {
  isAbsolute as nodeIsAbsolute,
  relative,
  resolve as nodeResolve,
} from "node:path"

import resolve from "eslint-module-utils/resolve"
import isCoreModule from "is-core-module"

import { getContextPackagePath } from "./package-path.js"

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
export function isBuiltIn(name, settings, path) {
  if (path || !name) return false
  const base = baseModule(name)
  const extras = (settings && settings["import/core-modules"]) || []
  return isCoreModule(base) || extras.includes(base)
}

export function isExternalModule(name, path, context) {
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

export function isExternalModuleMain(name, path, context) {
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
export function isScoped(name) {
  return name && scopedRegExp.test(name)
}

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