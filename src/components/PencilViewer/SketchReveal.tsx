import { useFrame, useThree } from '@react-three/fiber'
import type { MotionValue } from 'motion/react'
import { useLayoutEffect, useMemo, type RefObject } from 'react'
import * as THREE from 'three'
import { PENCIL_CENTER_Y, PENCIL_LENGTH } from './pencilDimensions.ts'
import type { PencilMaterialSet } from './pencilMaterials.ts'

/**
 * Sketch to model. The pencil first exists as an ink drawing on the paper
 * stage: silhouette outlines (inverted hull, constant screen width), crease
 * lines, and a paper fill cross-hatched by how far each face turns from the
 * light. A cobalt render front then sweeps tip to crown; behind it the real
 * materials draw, ahead of it the drawing does. Exactly one of the two
 * covers any point on the pencil, so there is never a double image.
 *
 * The front is an axial position in the model root's local space (the
 * pencil's own long axis), so it holds still on the pencil while the camera
 * and pose move. Film: a pure function of scroll progress. Viewers: a clock
 * that starts when the viewer is first on screen. Per frame this writes
 * uniforms only (zero allocation), and once the front clears the crown the
 * drawing layers are hidden, so they cost nothing for the rest of the page.
 */

/** Root-local axial extent of the assembled pencil, with a small margin. */
const AXIS_MIN = -PENCIL_CENTER_Y - 0.0015
const AXIS_MAX = PENCIL_LENGTH - PENCIL_CENTER_Y + 0.0015

/** Front value once the reveal is complete: beyond any axial position. */
const REVEALED = 1e6

/** Film window for the sweep, in master progress. */
export const SKETCH_FILM_START = 0.006
export const SKETCH_FILM_END = 0.085

/** Viewer timing: hold the drawing briefly, then sweep. Milliseconds. */
const VIEWER_HOLD_MS = 450
const VIEWER_SWEEP_MS = 1500

/** Mutable start time for a viewer reveal; null until the viewer is seen. */
export interface SketchClock {
  startedAt: number | null
}

function ease(t: number): number {
  const x = Math.min(1, Math.max(0, t))
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

/** Front position for a film progress value. Pure, so reverse scrub retraces it. */
export function filmFront(p: number): number {
  const t = ease((p - SKETCH_FILM_START) / (SKETCH_FILM_END - SKETCH_FILM_START))
  return AXIS_MIN + t * (AXIS_MAX - AXIS_MIN)
}

interface SketchUniforms {
  uFront: { value: number }
  uFeather: { value: number }
  uGlowStrength: { value: number }
  uRootInverse: { value: THREE.Matrix4 }
  uInk: { value: THREE.Color }
  uPaper: { value: THREE.Color }
  uGlow: { value: THREE.Color }
  uResolution: { value: THREE.Vector2 }
  uPixelRatio: { value: number }
  uHullWidth: { value: number }
}

const AXIAL_VERTEX = /* glsl */ `
  uniform mat4 uRootInverse;
  varying float vSketchAxial;
`

const HULL_VERTEX = /* glsl */ `
  ${AXIAL_VERTEX}
  uniform vec2 uResolution;
  uniform float uHullWidth;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vSketchAxial = (uRootInverse * world).y;
    vec4 clip = projectionMatrix * viewMatrix * world;
    vec3 nWorld = normalize(mat3(modelMatrix) * normal);
    vec2 dir = (projectionMatrix * viewMatrix * vec4(nWorld, 0.0)).xy;
    float len = length(dir);
    dir = len > 1e-6 ? dir / len : vec2(0.0);
    clip.xy += dir * uHullWidth * 2.0 / uResolution * clip.w;
    gl_Position = clip;
  }
`

const INK_FRAGMENT = /* glsl */ `
  uniform float uFront;
  uniform vec3 uInk;
  varying float vSketchAxial;
  void main() {
    if (vSketchAxial < uFront) discard;
    gl_FragColor = linearToOutputTexel(vec4(uInk, 1.0));
  }
`

const LINE_VERTEX = /* glsl */ `
  ${AXIAL_VERTEX}
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vSketchAxial = (uRootInverse * world).y;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const LINE_FRAGMENT = /* glsl */ `
  uniform float uFront;
  uniform vec3 uInk;
  varying float vSketchAxial;
  void main() {
    if (vSketchAxial < uFront) discard;
    gl_FragColor = linearToOutputTexel(vec4(uInk, 0.82));
  }
`

const CENTER_FRAGMENT = /* glsl */ `
  uniform float uFront;
  uniform vec3 uGlow;
  varying float vSketchAxial;
  void main() {
    if (vSketchAxial < uFront) discard;
    // Drafting chain line: 7 mm dash, 1.2 mm gap, 1 mm dot, 1.2 mm gap.
    float s = mod(vSketchAxial * 1000.0, 10.4);
    if ((s > 7.0 && s < 8.2) || s > 9.2) discard;
    gl_FragColor = linearToOutputTexel(vec4(uGlow, 0.75));
  }
`

const FILL_VERTEX = /* glsl */ `
  ${AXIAL_VERTEX}
  varying vec3 vSketchNormal;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vSketchAxial = (uRootInverse * world).y;
    vSketchNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const FILL_FRAGMENT = /* glsl */ `
  uniform float uFront;
  uniform vec3 uInk;
  uniform vec3 uPaper;
  uniform float uPixelRatio;
  varying float vSketchAxial;
  varying vec3 vSketchNormal;
  float hatch(vec2 p, vec2 dir, float spacing) {
    float d = abs(fract(dot(p, dir) / spacing) - 0.5) * spacing;
    return 1.0 - smoothstep(0.35, 1.05, d);
  }
  void main() {
    if (vSketchAxial < uFront) discard;
    vec3 n = normalize(vSketchNormal);
    float lit = clamp(dot(n, normalize(vec3(-0.45, 0.65, 0.62))) * 0.5 + 0.5, 0.0, 1.0);
    float shade = 1.0 - lit;
    vec2 p = gl_FragCoord.xy / uPixelRatio;
    float h1 = hatch(p, normalize(vec2(1.0, 1.0)), 5.0) * smoothstep(0.38, 0.62, shade);
    float h2 = hatch(p, normalize(vec2(1.0, -1.0)), 5.0) * smoothstep(0.62, 0.85, shade);
    float ink = clamp(h1 + h2, 0.0, 1.0) * 0.5 + shade * 0.05;
    gl_FragColor = linearToOutputTexel(vec4(mix(uPaper, uInk, ink), 1.0));
  }
`

function noRaycast(): void {}

/** Patches a physical material to stop at the front and glow along it. */
function patchMaterial(material: THREE.Material, uniforms: SketchUniforms): void {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uFront = uniforms.uFront
    shader.uniforms.uFeather = uniforms.uFeather
    shader.uniforms.uGlowStrength = uniforms.uGlowStrength
    shader.uniforms.uRootInverse = uniforms.uRootInverse
    shader.uniforms.uGlow = uniforms.uGlow
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${AXIAL_VERTEX}`)
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        vSketchAxial = (uRootInverse * modelMatrix * vec4(transformed, 1.0)).y;`,
      )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uFront;
        uniform float uFeather;
        uniform float uGlowStrength;
        uniform vec3 uGlow;
        varying float vSketchAxial;`,
      )
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
        if (vSketchAxial > uFront) discard;`,
      )
      .replace(
        '#include <dithering_fragment>',
        `float sketchRing = 1.0 - smoothstep(0.0, uFeather, uFront - vSketchAxial);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, uGlow, sketchRing * uGlowStrength);
        #include <dithering_fragment>`,
      )
  }
  // Every patched material shares one program variant per material type.
  material.customProgramCacheKey = () => 'sketch-reveal-v1'
  material.needsUpdate = true
}

interface SketchRevealProps {
  /** The group whose local Y axis is the pencil's long axis. */
  root: RefObject<THREE.Group | null>
  materials: PencilMaterialSet
  /** Film: scroll-driven front. */
  progress?: MotionValue<number>
  /** Viewer: time-driven front, started by the viewer's visibility. */
  clock?: SketchClock
  /** Paper behind the drawing; a function is sampled every frame. */
  paper?: string | ((target: THREE.Color) => void)
}

/** Mounts the drawing layers on every mesh under `root` and drives the front. */
export function SketchReveal({
  root,
  materials,
  progress,
  clock,
  paper = '#ecede9',
}: SketchRevealProps) {
  const size = useThree((state) => state.size)
  const dpr = useThree((state) => state.viewport.dpr)

  const uniforms = useMemo<SketchUniforms>(
    () => ({
      uFront: { value: AXIS_MIN },
      uFeather: { value: 0.0022 },
      uGlowStrength: { value: 0 },
      uRootInverse: { value: new THREE.Matrix4() },
      uInk: { value: new THREE.Color('#17191d') },
      uPaper: { value: new THREE.Color(typeof paper === 'string' ? paper : '#ecede9') },
      uGlow: { value: new THREE.Color('#2f4bd6') },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uPixelRatio: { value: 1 },
      uHullWidth: { value: 1.5 },
    }),
    // Paper strings are fixed per mount; a function paper is read per frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const layers = useMemo(() => {
    const hull = new THREE.ShaderMaterial({
      uniforms: uniforms as unknown as Record<string, THREE.IUniform>,
      vertexShader: HULL_VERTEX,
      fragmentShader: INK_FRAGMENT,
      side: THREE.BackSide,
    })
    const fill = new THREE.ShaderMaterial({
      uniforms: uniforms as unknown as Record<string, THREE.IUniform>,
      vertexShader: FILL_VERTEX,
      fragmentShader: FILL_FRAGMENT,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    })
    const line = new THREE.ShaderMaterial({
      uniforms: uniforms as unknown as Record<string, THREE.IUniform>,
      vertexShader: LINE_VERTEX,
      fragmentShader: LINE_FRAGMENT,
      transparent: true,
      depthWrite: false,
    })
    const center = new THREE.ShaderMaterial({
      uniforms: uniforms as unknown as Record<string, THREE.IUniform>,
      vertexShader: LINE_VERTEX,
      fragmentShader: CENTER_FRAGMENT,
      transparent: true,
      depthTest: false,
    })
    return { hull, fill, line, center }
  }, [uniforms])

  // Patch the real materials before their first compile.
  useLayoutEffect(() => {
    for (const material of Object.values(materials)) patchMaterial(material, uniforms)
  }, [materials, uniforms])

  // Build the drawing layers as children of each mesh so they inherit every
  // transform the model and the film director apply.
  const built = useMemo(
    () => ({ objects: [] as THREE.Object3D[], owned: [] as THREE.BufferGeometry[] }),
    [],
  )
  useLayoutEffect(() => {
    const group = root.current
    if (group === null) return
    const meshes: THREE.Mesh[] = []
    group.traverse((object) => {
      const mesh = object as THREE.Mesh
      if (mesh.isMesh && mesh.userData.sketch !== true) meshes.push(mesh)
    })
    const edgeCache = new Map<string, THREE.EdgesGeometry>()
    for (const mesh of meshes) {
      const hull = new THREE.Mesh(mesh.geometry, layers.hull)
      const fill = new THREE.Mesh(mesh.geometry, layers.fill)
      let edges = edgeCache.get(mesh.geometry.uuid)
      if (edges === undefined) {
        edges = new THREE.EdgesGeometry(mesh.geometry, 38)
        edgeCache.set(mesh.geometry.uuid, edges)
        built.owned.push(edges)
      }
      const lines = new THREE.LineSegments(edges, layers.line)
      for (const obj of [hull, fill, lines]) {
        obj.userData.sketch = true
        obj.frustumCulled = false
        // Never a raycast target: callout occlusion and part inspection
        // must keep hitting the real parts, even while these are hidden.
        obj.raycast = noRaycast
        mesh.add(obj)
        built.objects.push(obj)
      }
    }
    const axis = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, AXIS_MIN - 0.012, 0),
      new THREE.Vector3(0, AXIS_MAX + 0.012, 0),
    ])
    built.owned.push(axis)
    const centerline = new THREE.Line(axis, layers.center)
    centerline.userData.sketch = true
    centerline.raycast = noRaycast
    centerline.renderOrder = 10
    group.add(centerline)
    built.objects.push(centerline)
    return () => {
      for (const obj of built.objects) obj.removeFromParent()
      for (const geometry of built.owned) geometry.dispose()
      built.objects.length = 0
      built.owned.length = 0
    }
  }, [root, layers, built])

  useLayoutEffect(
    () => () => {
      layers.hull.dispose()
      layers.fill.dispose()
      layers.line.dispose()
      layers.center.dispose()
    },
    [layers],
  )

  useFrame(() => {
    const group = root.current
    if (group === null) return
    let front = AXIS_MAX
    if (progress !== undefined) {
      front = filmFront(progress.get())
    } else if (clock !== undefined) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduced) front = AXIS_MAX
      else if (clock.startedAt === null) front = AXIS_MIN
      else {
        const t = (performance.now() - clock.startedAt - VIEWER_HOLD_MS) / VIEWER_SWEEP_MS
        front = AXIS_MIN + ease(t) * (AXIS_MAX - AXIS_MIN)
      }
    }
    const sweeping = front > AXIS_MIN && front < AXIS_MAX
    uniforms.uGlowStrength.value = sweeping ? 0.85 : 0
    const drawing = front < AXIS_MAX
    for (const obj of built.objects) obj.visible = drawing
    if (!drawing) {
      // Revealed: park the front out of reach. The root matrix stops
      // updating here, and the pose keeps moving (the exploded parts travel
      // far along the axis), so a front at the crown would start clipping
      // whatever the stale matrix maps past it.
      uniforms.uFront.value = REVEALED
      return
    }
    uniforms.uFront.value = front
    group.updateWorldMatrix(true, false)
    uniforms.uRootInverse.value.copy(group.matrixWorld).invert()
    uniforms.uResolution.value.set(size.width * dpr, size.height * dpr)
    uniforms.uPixelRatio.value = dpr
    uniforms.uHullWidth.value = 1.25 * dpr
    if (typeof paper === 'function') paper(uniforms.uPaper.value)
  })

  return null
}
