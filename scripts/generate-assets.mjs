import { mkdirSync, writeFileSync } from 'node:fs'

// Procedural local assets only. Run once, commit outputs. Nothing fetched.
mkdirSync('public/images/finishes', { recursive: true })
mkdirSync('public/images/camera', { recursive: true })
mkdirSync('public/og', { recursive: true })

const finishes = {
  obsidian: ['#43464e', '#0b0b0e', '#26282f'],
  titanium: ['#ffffff', '#9ba0ab', '#3f424b'],
  glacier: ['#ffffff', '#d4deee', '#8fa6cc'],
  ember: ['#e8a06a', '#4a2e1a', '#241209'],
  slate: ['#6a6e76', '#232529', '#101114'],
}
for (const [id, [a, b, c]] of Object.entries(finishes)) {
  writeFileSync(
    `public/images/finishes/${id}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="0.55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient></defs><rect width="200" height="400" rx="28" fill="url(#g)"/><rect x="20" y="20" width="160" height="360" rx="18" fill="none" stroke="rgba(255,255,255,0.14)"/></svg>\n`,
  )
  console.log(`finish ${id}`)
}

const scenes = {
  'scene-ultra': ['#0d1c33', '122 deg', 'M20 300 L100 180 L180 300 L140 300 L110 240 L80 300 Z'],
  'scene-main': ['#101d31', 'Main', 'M40 300 L140 160 L220 300 L180 300 L140 220 L100 300 Z'],
  'scene-zoom2': ['#122239', '2x', 'M80 300 L160 190 L240 300 L200 300 L160 230 L120 300 Z'],
  'scene-tele5': ['#14263f', '5x', 'M120 300 L180 210 L240 300 L210 300 L180 240 L150 300 Z'],
  'scene-tele10': ['#16294a', '10x', 'M150 300 L190 230 L230 300 L210 300 L190 250 L170 300 Z'],
}
for (const [id, [bg, label, ridge]] of Object.entries(scenes)) {
  writeFileSync(
    `public/images/camera/${id}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240"><rect width="320" height="240" fill="${bg}"/><circle cx="250" cy="50" r="18" fill="rgba(240,246,255,0.85)"/><path d="${ridge}" fill="rgba(200,218,245,0.25)"/><rect y="200" width="320" height="40" fill="rgba(0,0,0,0.35)"/><text x="16" y="30" font-family="monospace" font-size="14" fill="rgba(255,255,255,0.8)">${label}</text></svg>\n`,
  )
  console.log(`scene ${id}`)
}

const routes = [
  ['home', 'Aether One X', 'Power, without the noise.'],
  ['cameras', 'Cameras', 'Every focal length.'],
  ['performance', 'Performance', 'A1 Ultra.'],
  ['display', 'Display', 'Light, controlled.'],
  ['software', 'Software', 'Quiet software.'],
  ['specifications', 'Specifications', 'Nothing hidden.'],
]
for (const [id, title, sub] of routes) {
  writeFileSync(
    `public/og/${id}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#0a0a0c"/><rect x="548" y="150" width="104" height="220" rx="20" fill="none" stroke="#7fb4ff" stroke-width="3"/><text x="600" y="440" font-family="sans-serif" font-size="64" font-weight="600" fill="#f2f2f4" text-anchor="middle">${title}</text><text x="600" y="490" font-family="monospace" font-size="28" fill="#9c9da7" text-anchor="middle">${sub}</text><text x="600" y="560" font-family="monospace" font-size="20" fill="#85868f" text-anchor="middle">Fictional concept. Illustrative values.</text></svg>\n`,
  )
  console.log(`og ${id}`)
}
