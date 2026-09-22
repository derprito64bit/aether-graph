import { lensSpecs } from '../../../components/PhoneViewer/CameraAssembly.tsx'
import { PERISCOPE, TOF } from '../../../components/PhoneViewer/phoneDimensions.ts'
import { CAMERA_INTERNAL } from '../layout.ts'
import type { InternalsMaterialSet } from '../internalsMaterials.ts'
import type { PartRegister } from './register.ts'

/**
 * Internal camera housings over the layout manifest (Prompt C section 6):
 * one main housing block matching the A2 module footprint, three round lens
 * barrels on the triangle, the periscope block below, and the ToF module as
 * its own exploding part. Positions line up with the exterior lenses the
 * viewer just saw, or the exploded view will not read.
 */
export function OpticsPart({
  materials,
  register,
}: {
  materials: InternalsMaterialSet
  register: PartRegister
}) {
  const specs = lensSpecs()
  const { cx, cy, cz, r } = CAMERA_INTERNAL
  return (
    <group userData={{ part: 'optics', readout: '135 mm folded periscope' }}>
      {/* Main housing block: the module footprint, seen from inside */}
      <group ref={register('camera-module')}>
        <mesh position={[cx, cy, cz]}>
          <cylinderGeometry args={[r * 0.92, r * 0.92, 0.0022, 48]} />
          <primitive object={materials.housing} attach="material" />
        </mesh>
      </group>
      <group ref={register('sensor-stack')}>
        <mesh position={[cx, cy, cz + 0.0014]}>
          <cylinderGeometry args={[0.0131, 0.0131, 0.0012, 48]} />
          <primitive object={materials.housing} attach="material" />
        </mesh>
      </group>
      {specs.map((lens) => (
        <group key={lens.key} ref={register(`lens-${lens.key}`)} position={[lens.x, lens.y, cz]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[lens.r, lens.r * 1.1, 0.0024, 24]} />
            <primitive object={materials.housing} attach="material" />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.0004]}>
            <circleGeometry args={[lens.r * 0.7, 24]} />
            <primitive object={materials.dark} attach="material" />
          </mesh>
        </group>
      ))}
      {/* Periscope block below the triangle, matching the exterior window */}
      <group ref={register('lens-periscope')} position={[cx + PERISCOPE.x, cy + PERISCOPE.y, cz]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[PERISCOPE.w, PERISCOPE.h, 0.0026]} />
          <primitive object={materials.housing} attach="material" />
        </mesh>
      </group>
      {/* ToF module behind its window, separating on its own delay */}
      <group
        ref={register('tof-module')}
        position={[
          cx + TOF.ringR * Math.cos((TOF.angleDeg * Math.PI) / 180),
          cy + TOF.ringR * Math.sin((TOF.angleDeg * Math.PI) / 180),
          cz,
        ]}
      >
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.0082, 0.0034, 0.0012]} />
          <primitive object={materials.housing} attach="material" />
        </mesh>
      </group>
    </group>
  )
}
