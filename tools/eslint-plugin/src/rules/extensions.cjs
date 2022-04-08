const path = require("node:path")

const moduleVisitor = require("eslint-module-utils/moduleVisitor.js").default
const resolve = require("eslint-module-utils/resolve.js").default

const {
  isBuiltIn,
  isExternalModule,
  isScoped,
} = require("../core/import-type.cjs")
// import docsUrl from "../docsUrl"

const enumValues = { enum: ["always", "ignorePackages", "never"] }
const patternProperties = {
  type: "object",
  patternProperties: { ".*": enumValues },
}
const properties = {
  type: "object",
  properties: {
    pattern: patternProperties,
    ignorePackages: { type: "boolean" },
  },
}

function buildProperties(context) {
  const result = {
    defaultConfig: "never",
    pattern: {},
    ignorePackages: false,
  }

  for (const object of context.options) {
    // If this is a string, set defaultConfig to its value
    if (typeof object === "string") {
      result.defaultConfig = object
      continue
    }

    // If this is not the new structure, transfer all props to result.pattern
    if (object.pattern === undefined && object.ignorePackages === undefined) {
      Object.assign(result.pattern, object)
      continue
    }

    // If pattern is provided, transfer all props
    if (object.pattern !== undefined) {
      Object.assign(result.pattern, object.pattern)
    }

    // If ignorePackages is provided, transfer it to result
    if (object.ignorePackages !== undefined) {
      result.ignorePackages = object.ignorePackages
    }
  }

  if (result.defaultConfig === "ignorePackages") {
    result.defaultConfig = "always"
    result.ignorePackages = true
  }

  return result
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      // url: docsUrl("extensions"),
    },
    fixable: "code",
    schema: {
      anyOf: [
        {
          type: "array",
          items: [enumValues],
          additionalItems: false,
        },
        {
          type: "array",
          items: [enumValues, properties],
          additionalItems: false,
        },
        {
          type: "array",
          items: [properties],
          additionalItems: false,
        },
        {
          type: "array",
          items: [patternProperties],
          additionalItems: false,
        },
        {
          type: "array",
          items: [enumValues, patternProperties],
          additionalItems: false,
        },
      ],
    },
  },

  create(context) {
    const properties_ = buildProperties(context)

    function getModifier(extension) {
      return properties_.pattern[extension] || properties_.defaultConfig
    }

    function isUseOfExtensionRequired(extension, isPackage) {
      return (
        getModifier(extension) === "always" &&
        (!properties_.ignorePackages || !isPackage)
      )
    }

    function isUseOfExtensionForbidden(extension) {
      return getModifier(extension) === "never"
    }

    function isResolvableWithoutExtension(file) {
      const extension = path.extname(file)
      const fileWithoutExtension = file.slice(0, -extension.length)
      const resolvedFileWithoutExtension = resolve(
        fileWithoutExtension,
        context,
      )

      return resolvedFileWithoutExtension === resolve(file, context)
    }

    // eslint-disable-next-line unicorn/consistent-function-scoping
    function isExternalRootModule(file) {
      const slashCount = file.split("/").length - 1

      if (slashCount === 0) return true
      if (isScoped(file) && slashCount <= 1) return true
      return false
    }

    function checkFileExtension(source, node) {
      // bail if the declaration doesn't have a source, e.g. "export { foo };", or if it's only partially typed like in an editor
      if (!source || !source.value) return

      const importPathWithQueryString = source.value

      // don't enforce anything on builtins
      if (isBuiltIn(importPathWithQueryString, context.settings)) return

      const importPath = importPathWithQueryString.replace(/\?(.*)$/, "")

      // don't enforce in root external packages as they may have names with `.js`.
      // Like `import Decimal from decimal.js`)
      if (isExternalRootModule(importPath)) return

      const resolvedPath = resolve(importPath, context)

      // get extension from resolved path, if possible.
      // for unresolved, use source value.
      const extension = path.extname(resolvedPath || importPath).slice(1)

      const shouldIgnore =
        extension === "ts" &&
        (importPath.endsWith(".js") || !importPath.startsWith("."))
      // console.log("!!!!", { extension, importPath, shouldIgnore, node })
      if (shouldIgnore) {
        return
      }

      // determine if this is a module
      const isPackage =
        isExternalModule(importPath, resolve(importPath, context), context) ||
        isScoped(importPath)

      // console.log(node)

      if (importPath.endsWith(".ts")) {
        const fixedPath = importPath.replace(/\.ts$/, ".js")
        // console.log(node)
        context.report({
          node: source,
          // message: `Unexpected use of file extension ".ts" for "${importPathWithQueryString}"`,
          // message: `Change file extension to ".js" for "${importPathWithQueryString}"`,
          message: `Change import path to "${fixedPath}".`,
          fix(fixer) {
            // fixer.replaceTextRange(node.range, fixedPath)
            // return fixer.replaceText(node, fixedPath)
            // return fixer.replaceText(
            //   node,
            //   node.source.raw.replace(/\.ts$/, ".js"),
            // )
            return fixer.replaceTextRange(
              [node.source.range[0] + 1, node.source.range[1] - 1],
              fixedPath,
            )
          },
        })
      } else if (!extension) {
        // ignore type-only imports
        if (node.importKind === "type") return
        const extensionRequired = isUseOfExtensionRequired(extension, isPackage)
        const extensionForbidden = isUseOfExtensionForbidden(extension)
        if (extensionRequired && !extensionForbidden) {
          const fixedPath = `${importPathWithQueryString}.js`
          context.report({
            node: source,
            // message: `Add file extension ".js" to "${importPathWithQueryString}"`,
            message: `Change import path to "${fixedPath}".`,
            fix(fixer) {
              // fixer.replaceTextRange(node.range, fixedPath)
              return fixer.insertTextAfterRange(
                [node.range[0], node.range[1] - 1],
                ".js",
              )
              // return fixer.insertTextAfter(node, ".js")
            },
          })
        }
      } else if (extension === "ts") {
        // eslint-disable-next-line unicorn/no-lonely-if
        // if (
        //   isUseOfExtensionForbidden(extension) &&
        //   isResolvableWithoutExtension(importPath)
        // ) {
        const resolvesToIndex = resolvedPath.endsWith("index.ts")
        const includesIndex = importPath.endsWith("/index")
        const insertText =
          resolvesToIndex && !includesIndex ? "/index.js" : ".js"
        const fixedPath = `${importPathWithQueryString}${insertText}`
        // console.log({ resolvedPath, importPath, fixedPath })
        context.report({
          node: source,
          // message: `Missing file extension ".js" for "${importPathWithQueryString}"`,
          message: `Change import path to "${fixedPath}".`,
          fix(fixer) {
            // fixer.replaceTextRange(node.range, fixedPath)
            return fixer.insertTextAfterRange(
              [node.range[0], node.range[1] - 1],
              insertText,
            )
            // return fixer.insertTextAfter(node, ".js")
          },
        })
        // }
      }
    }

    return moduleVisitor(checkFileExtension, { commonjs: true })
  },
}
