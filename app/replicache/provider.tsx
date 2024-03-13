import { createContext, ReactNode, useContext, useMemo } from 'react'
import { Replicache } from 'replicache'
import { mutators } from './mutators.ts'

const createReplicacheClient = (licenseKey: string, userId?: string | null) => {
  if (typeof window === 'undefined' || !userId) {
    return null
  }

  return new Replicache({
    name: userId,
    licenseKey,
    pushURL: `/replicache/push?userID=${userId}`,
    pullURL: `/replicache/pull?userID=${userId}`,
    mutators,
    logLevel: 'debug'
  })
}

export const ReplicacheContext = createContext<Required<ReturnType<typeof createReplicacheClient>>>(null)

export const ReplicacheProvider = ({
  children,
  userId,
  licenseKey
}: {
  children: ReactNode
  userId?: string | null
  licenseKey: string
}) => {
  const replicache = useMemo(() => createReplicacheClient(licenseKey, userId), [licenseKey, userId])

  return <ReplicacheContext.Provider value={replicache}>{children}</ReplicacheContext.Provider>
}

export function useReplicache() {
  return useContext(ReplicacheContext)
}
