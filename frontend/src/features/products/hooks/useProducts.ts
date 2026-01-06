import { useEffect, useState } from 'react'
import { listProducts, type Product } from '../../../api/products'

type State = {
  products: Product[]
  loading: boolean
  error: string | null
}

export function useProducts(): State {
  const [state, setState] = useState<State>({
    products: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setState((s) => ({ ...s, loading: true, error: null }))
        const response = await listProducts()
        if (!cancelled) {
          setState({ products: response.results, loading: false, error: null })
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to load products'
        if (!cancelled) {
          setState({ products: [], loading: false, error: message })
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
