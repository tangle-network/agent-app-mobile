import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import pkg from '../package.json'

const banned = [
  '@tangle-network/agent-app/web-react',
  '@tangle-network/agent-app/composer',
  '@tangle-network/agent-app/web-react/terminal',
  '@tangle-network/sandbox-ui',
  '@xterm/',
  '@xyflow/react',
]

interface PackageDependencyMap {
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : [path]
  })
}

describe('mobile import boundary', () => {
  it('does not import web or terminal-only packages', () => {
    const contents = files(join(process.cwd(), 'src'))
      .map((path) => readFileSync(path, 'utf8'))
      .join('\n')

    for (const pattern of banned) expect(contents).not.toContain(pattern)
  })

  it('does not install the server/web agent-app package into native apps', () => {
    const manifest = pkg as PackageDependencyMap
    const dependencies = {
      ...manifest.dependencies,
      ...manifest.peerDependencies,
      ...manifest.devDependencies,
    }

    expect(dependencies).not.toHaveProperty('@tangle-network/agent-app')
  })
})
