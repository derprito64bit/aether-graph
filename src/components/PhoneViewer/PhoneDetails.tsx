import { useMemo } from 'react'
import * as THREE from 'three'
import {
  ANTENNA_BAND,
  BUTTON_POCKET,
  CHAMFER,
  EARPIECE,
  FRONT_GLASS,
  GRILLE_SLOT,
  MIC_R,
  MIC_X,
  PORT,
  PUNCH,
  SPEAKER_XS,
  SX,
  SY,
} from './phoneDimensions.ts'
import { createRoundedRectGeometry, createSlabGeometry } from './phoneGeometry.ts'
import type { PhoneMaterialSet } from './phoneMaterials.ts'

export function EdgeDetails({ set, detail }: { set: PhoneMaterialSet; detail: 'high' | 'low' }) {
  const portCollarGeo = useMemo(
    () => createRoundedRectGeometry(PORT.w, PORT.h, PORT.r, 0.0005, CHAMFER.portMouth, 0.00013),
    [],
  )
  const speakerMesh = useMemo(() => {
    // Six asymmetric slots marching right of the port, one instanced mesh.
    const geo = new THREE.BoxGeometry(GRILLE_SLOT.w, GRILLE_SLOT.h, GRILLE_SLOT.depth)
    const mesh = new THREE.InstancedMesh(geo, set.speaker, SPEAKER_XS.length)
    const m = new THREE.Matrix4()
    SPEAKER_XS.forEach((x, i) => {
      m.setPosition(x, -SY + 0.0003, 0)
      mesh.setMatrixAt(i, m)
    })
    mesh.instanceMatrix.needsUpdate = true
    return mesh
  }, [set])
  return (
    <group>
      <ButtonPocket set={set} y={0.02} height={0.014} power />
      <ButtonPocket set={set} y={0.047} height={0.032} />
      {/* Antenna interruption bands: 1.4mm wide, outer face 0.05mm below the rail */}
      <Seam set={set} x={SX - ANTENNA_BAND.inset - 0.0002} y={0.026} />
      <Seam set={set} x={SX - ANTENNA_BAND.inset - 0.0002} y={-0.024} />
      <Seam set={set} x={-SX + ANTENNA_BAND.inset + 0.0002} y={0.058} />
      <Seam set={set} x={-SX + ANTENNA_BAND.inset + 0.0002} y={-0.042} />
      {/* SIM tray: outer face 0.1mm below the rail, dark parting plate behind */}
      <mesh position={[-SX - 0.00008, 0.05, 0]}>
        <boxGeometry args={[0.0001, 0.0065, 0.0017]} />
        <primitive object={set.antenna} attach="material" />
      </mesh>
      <mesh position={[-SX + 0.0001, 0.05, 0]}>
        <boxGeometry args={[0.0004, 0.0062, 0.0014]} />
        <primitive object={set.simTray} attach="material" />
      </mesh>
      {/* SIM parting line plus eject pinhole, real geometry */}
      <mesh position={[-SX - 0.0001, 0.0535, 0.0004]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.0003, 0.0003, 0.0004, 10]} />
        <primitive object={set.port} attach="material" />
      </mesh>
      {/* USB-C mouth: chamfered rim proud of the edge */}
      <mesh geometry={portCollarGeo} position={[0, -SY - 0.0002, 0]}>
        <primitive object={set.frameChamfer} attach="material" />
      </mesh>
      {/* Cavity interior set inside the edge line, self-shadowing dark */}
      <mesh position={[0, -SY + 0.0006, 0]}>
        <boxGeometry args={[PORT.w - 0.0012, 0.0012, PORT.cavityDepth]} />
        <primitive object={set.port} attach="material" />
      </mesh>
      {detail === 'high' ? (
        <group>
          {/* Tongue with a contact glint strip */}
          <mesh position={[0, -SY - 0.0001, 0.0002]}>
            <boxGeometry args={[PORT.tongue.w, PORT.tongue.h, PORT.tongue.depth]} />
            <primitive object={set.portTongue} attach="material" />
          </mesh>
          <mesh position={[0, -SY - 0.0001, 0.0012]}>
            <boxGeometry args={[0.005, 0.0002, 0.0001]} />
            <primitive object={set.portContact} attach="material" />
          </mesh>
        </group>
      ) : null}
      <primitive object={speakerMesh} />
      {/* Primary mic: single hole left of the port, wider than a slot */}
      <mesh position={[MIC_X, -SY + 0.0003, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[MIC_R, MIC_R, 0.0012, 12]} />
        <primitive object={set.speaker} attach="material" />
      </mesh>
      {/* Top rail: secondary mic plus speaker slot, asymmetric */}
      <mesh position={[-0.012, SY + 0.0002, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.00035, 0.00035, 0.001, 10]} />
        <primitive object={set.speaker} attach="material" />
      </mesh>
      <mesh position={[0.014, SY + 0.0002, 0]}>
        <boxGeometry args={[0.003, 0.0005, 0.001]} />
        <primitive object={set.speaker} attach="material" />
      </mesh>
    </group>
  )
}

export function FrontGlassDetails({ set }: { set: PhoneMaterialSet }) {
  return (
    <group>
      {/* Earpiece slot, half-hidden in the top bezel line */}
      <mesh position={[0, EARPIECE.y, FRONT_GLASS.z + 0.00078]}>
        <boxGeometry args={[EARPIECE.w, EARPIECE.h, 0.00022]} />
        <primitive object={set.speaker} attach="material" />
      </mesh>
      {/* Punch-hole: dark aperture, 0.15mm ring, offset lens glint */}
      <mesh position={[0, PUNCH.y, FRONT_GLASS.z + 0.00085]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[PUNCH.r, PUNCH.r, 0.00025, 24]} />
        <primitive object={set.port} attach="material" />
      </mesh>
      <mesh position={[0, PUNCH.y, FRONT_GLASS.z + 0.00086]} rotation={[0, Math.PI, 0]}>
        <ringGeometry args={[PUNCH.r, PUNCH.r + PUNCH.ring, 24]} />
        <primitive object={set.lensCavity} attach="material" />
      </mesh>
      <mesh position={[0.0004, PUNCH.y + 0.0004, FRONT_GLASS.z + 0.00087]}>
        <circleGeometry args={[0.00028, 12]} />
        <primitive object={set.flashGlass} attach="material" />
      </mesh>
    </group>
  )
}

function ButtonPocket({
  set,
  y,
  height,
  power = false,
}: {
  set: PhoneMaterialSet
  y: number
  height: number
  power?: boolean
}) {
  const flangeGeo = useMemo(
    () =>
      createRoundedRectGeometry(
        0.0003,
        height + BUTTON_POCKET.gap * 2,
        0.0004,
        0.0017,
        CHAMFER.button,
        0.00012,
      ),
    [height],
  )
  const capGeo = useMemo(
    () => createSlabGeometry(0.0005, height, 0.0014, Math.min(0.00022, height / 2), CHAMFER.button),
    [height],
  )
  return (
    <group position={[SX - BUTTON_POCKET.recess, y, -0.0012]}>
      {/* Machined pocket: dark recessed surround drawing the 0.1mm gap line */}
      <mesh position={[0.0001, 0, 0.0006]}>
        <boxGeometry args={[0.0006, height + BUTTON_POCKET.gap * 2, 0.0016]} />
        <primitive object={set.antenna} attach="material" />
      </mesh>
      <mesh geometry={flangeGeo} position={[0.0002, 0, 0.0006]}>
        <primitive object={set.frameChamfer} attach="material" />
      </mesh>
      {/* Cap outer face lands 0.4mm proud of the rail */}
      <mesh geometry={capGeo} position={[BUTTON_POCKET.proud - 0.00025, 0, 0.0006]}>
        <primitive object={set.button} attach="material" />
      </mesh>
      {/* Power key carries fine horizontal grooves the rocker does not */}
      {power
        ? [-0.004, 0, 0.004].map((dy) => (
            <mesh key={dy} position={[BUTTON_POCKET.proud + 0.00002, dy, 0.0006]}>
              <boxGeometry args={[0.0001, 0.00006, 0.0002]} />
              <primitive object={set.antenna} attach="material" />
            </mesh>
          ))
        : null}
    </group>
  )
}

function Seam({ set, x, y }: { set: PhoneMaterialSet; x: number; y: number }) {
  return (
    <mesh position={[x, y, 0]}>
      <boxGeometry args={[0.0004, ANTENNA_BAND.w, ANTENNA_BAND.depth]} />
      <primitive object={set.antenna} attach="material" />
    </mesh>
  )
}
