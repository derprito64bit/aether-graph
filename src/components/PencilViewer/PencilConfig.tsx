import { createContext, useContext, useState, type ReactNode } from 'react'
import { DEFAULT_PENCIL_FINISH, type PencilFinishId } from '../../data/pencil.ts'

interface PencilConfigValue {
  finish: PencilFinishId
  setFinish: (finish: PencilFinishId) => void
  leadId: string
  setLeadId: (leadId: string) => void
}

const PencilConfigContext = createContext<PencilConfigValue | null>(null)

/** Finish and lead state shared by the viewers and the configurator. */
export function PencilConfigProvider({ children }: { children: ReactNode }) {
  const [finish, setFinish] = useState<PencilFinishId>(DEFAULT_PENCIL_FINISH)
  const [leadId, setLeadId] = useState<string>('05')
  return (
    <PencilConfigContext.Provider value={{ finish, setFinish, leadId, setLeadId }}>
      {children}
    </PencilConfigContext.Provider>
  )
}

/** Reads the pencil finish and lead state. Must render inside the provider. */
export function usePencilConfig(): PencilConfigValue {
  const value = useContext(PencilConfigContext)
  if (value === null) throw new Error('usePencilConfig must render inside PencilConfigProvider')
  return value
}
