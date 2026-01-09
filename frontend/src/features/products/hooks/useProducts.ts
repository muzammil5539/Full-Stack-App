import { useEffect, useState } from 'react'
import { listProducts, type Product } from '../../../api/products'

export type ProductsQuery = {
  search?: string
  ordering?: string
  category?: number
  brand?: number
  is_featured?: boolean
  page?: number
  page_size?: number
}

type State = {
  products: Product[]
  count: number
  next: string | null
  previous: string | null
  loading: boolean
  error: string | null
}

export function useProducts(query: ProductsQuery): State {
  const [state, setState] = useState<State>({
    products: [],
    count: 0,
    next: null,
    previous: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setState((s) => ({ ...s, loading: true, error: null }))
        const res = await listProducts({
          search: query.search,
          ordering: query.ordering,
          category: query.category,
          brand: query.brand,
          is_featured: query.is_featured,
          page: query.page,
          page_size: query.page_size,
        })
        if (cancelled) return
        setState({
          products: res.results,
          count: res.count,
          next: res.next,
          previous: res.previous,
          loading: false,
          error: null,
        })
      } catch (e: any) {
        if (cancelled) return
        const message = e instanceof Error ? e.message : String(e)
        setState((s) => ({ ...s, products: [], loading: false, error: message }))
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [
    query.search,
    query.ordering,
    query.category,
    query.brand,
    query.is_featured,
    query.page,
    query.page_size,
  ])

  return state
}
