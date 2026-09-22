import { createContext, useContext, useState, type ReactNode } from 'react'
import type { FinishId } from '../../data/product.ts'
import { DEFAULT_FINISH } from '../../data/product.ts'

/** Fourth entry is the folded periscope: focusable like the round lenses. */
export type FocusLensId = 'main' | 'ultra' | 'mid' | 'periscope'

interface PhoneConfigValue {
  finish: FinishId
  setFinish: (finish: FinishId) => void
  focusLens: FocusLensId
  setFocusLens: (lens: FocusLensId) => void
}

const PhoneConfigContext = createContext<PhoneConfigValue | null>(null)

/** Finish and lens focus state shared by the model and the configurator. */
export function PhoneConfigProvider({ children }: { children: ReactNode }) {
  const [finish, setFinish] = useState<FinishId>(DEFAULT_FINISH)
  const [focusLens, setFocusLens] = useState<FocusLensId>('main')
  return (
    <PhoneConfigContext.Provider value={{ finish, setFinish, focusLens, setFocusLens }}>
      {children}
    </PhoneConfigContext.Provider>
  )
}

/** Reads the phone finish and focus state. Must render inside the provider. */
export function usePhoneConfig(): PhoneConfigValue {
  const value = useContext(PhoneConfigContext)
  if (value === null) throw new Error('usePhoneConfig must render inside PhoneConfigProvider')
  return value
}
