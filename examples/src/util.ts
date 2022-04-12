import path from "node:path"
import url from "node:url"

export function buildExampleStackName(metaUrl: string) {
  return `cloudy-example-${path.basename(
    path.dirname(url.fileURLToPath(metaUrl)),
  )}`
}
