declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback?: (response: { credential: string }) => void }) => void
          renderButton: (element: HTMLElement, options: { theme?: string; size?: string; width?: string }) => void
          prompt: (callback: (notification: any) => void) => void
          cancel: () => void
          onLoad: (callback: () => void) => void
        }
      }
    }
  }
}

export {}
