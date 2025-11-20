import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import * as Network from 'expo-network'

interface ConnectivityState {
  isOnline: boolean
  connectionType: string
}

const ConnectivityContext = createContext<ConnectivityState>({
  isOnline: true,
  connectionType: 'unknown',
})

export function ConnectivityProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<ConnectivityState>({
    isOnline: true,
    connectionType: 'unknown',
  })

  useEffect(() => {
    let mounted = true
    Network.getNetworkStateAsync().then((network) => {
      if (!mounted) return
      setState({
        isOnline: Boolean(network?.isConnected && network.isInternetReachable),
        connectionType: network?.type ?? 'unknown',
      })
    })

    const subscription = Network.addNetworkStateListener((network) => {
      setState({
        isOnline: Boolean(
          network?.isConnected && network.isInternetReachable,
        ),
        connectionType: network?.type ?? 'unknown',
      })
    })

    return () => {
      mounted = false
      subscription.remove()
    }
  }, [])

  const value = useMemo(
    () => ({
      isOnline: state.isOnline,
      connectionType: state.connectionType,
    }),
    [state.isOnline, state.connectionType],
  )

  return (
    <ConnectivityContext.Provider value={value}>
      {children}
    </ConnectivityContext.Provider>
  )
}

export const useConnectivity = () => useContext(ConnectivityContext)


