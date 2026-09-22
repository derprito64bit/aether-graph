import type * as THREE from 'three'

/** Registers one exploded part group by id (see explode.ts). */
export type PartRegister = (id: string) => (group: THREE.Group | null) => void
