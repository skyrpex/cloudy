const { dirname } = require("node:path")

const pkgUp = require("eslint-module-utils/pkgUp.js")
const readPkgUp = require("eslint-module-utils/readPkgUp.js")

exports.getContextPackagePath = function getContextPackagePath(context) {
  return getFilePackagePath(
    context.getPhysicalFilename
      ? context.getPhysicalFilename()
      : context.getFilename(),
  )
}

exports.getFilePackagePath = function getFilePackagePath(filePath) {
  const fp = pkgUp({ cwd: filePath })
  return dirname(fp)
}

exports.getFilePackageName = function getFilePackageName(filePath) {
  const { pkg, path } = readPkgUp({ cwd: filePath, normalize: false })
  if (pkg) {
    // recursion in case of intermediate esm package.json without name found
    return pkg.name || getFilePackageName(dirname(dirname(path)))
  }
  // return null
}
