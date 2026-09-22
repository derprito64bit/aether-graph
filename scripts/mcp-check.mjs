import { spawn } from 'node:child_process'

const [cmd, url] = process.argv.slice(2)

if (cmd === 'http') {
  const body = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'setup-verify', version: '1.0' },
    },
  })
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body,
    })
    const text = await res.text()
    const ok = res.status === 200 || res.status === 202
    console.log(
      ok && (text.includes('jsonrpc') || text.includes('result'))
        ? 'CONNECT_OK'
        : `HTTP ${res.status}: ${text.slice(0, 200)}`,
    )
  } catch (e) {
    console.log('HTTP_ERROR: ' + e.message)
  }
  process.exit(0)
}

const child = spawn(cmd, ['-y', url], { shell: true, stdio: ['pipe', 'pipe', 'pipe'] })
let buf = ''
let responded = false

child.stdout.on('data', (d) => {
  buf += d.toString()
  for (const line of buf.split('\n')) {
    if (!line.trim() || !line.startsWith('{')) continue
    try {
      const msg = JSON.parse(line)
      if (msg.id === 1 || msg.id === 2) {
        responded = true
        const res = msg.result ? 'CONNECT_OK' : `ERR: ${JSON.stringify(msg.error).slice(0, 200)}`
        console.log(res)
        if (res === 'CONNECT_OK') {
          child.stdin.write(
            JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n',
          )
          child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' }) + '\n')
        }
      }
      if (msg.id === 2) {
        const n = msg.result && msg.result.tools ? msg.result.tools.length : 0
        console.log(`TOOLS:${n}`)
        child.kill()
        process.exit(0)
      }
    } catch {}
  }
})

child.stderr.on('data', () => {})
child.on('error', (e) => {
  console.log('SPAWN_ERROR: ' + e.message)
  process.exit(1)
})

child.stdin.write(
  JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'setup-verify', version: '1.0' },
    },
  }) + '\n',
)

setTimeout(() => {
  if (!responded) {
    console.log('TIMEOUT_OR_SILENT')
    child.kill()
    process.exit(1)
  }
}, 30000)
