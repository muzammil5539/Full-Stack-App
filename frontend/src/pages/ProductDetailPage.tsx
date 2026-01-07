import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getProductBySlug, type Product, type ProductVariant } from '../api/products'
import { addCartItem } from '../api/cart'
import { deleteReview, listReviews, submitReview, type Review } from '../api/reviews'
import { getMyUser } from '../api/accounts'
import { useAuthToken } from '../auth/useAuthToken'
import ErrorMessage from '../shared/ui/ErrorMessage'
import Loading from '../shared/ui/Loading'

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { isAuthenticated } = useAuthToken()
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [myUserId, setMyUserId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [addingToCart, setAddingToCart] = useState(false)
  const [addSuccess, setAddSuccess] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null)
  const didPrefillReviewFormRef = useRef(false)

  useEffect(() => {
    didPrefillReviewFormRef.current = false
  }, [slug])

  useEffect(() => {
    const slugParam = slug
    if (!slugParam) return
    const slugValue = slugParam

    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const prod = await getProductBySlug(slugValue)
        const [revs, me] = await Promise.all([
          listReviews(prod.id),
          isAuthenticated ? getMyUser() : Promise.resolve(null),
        ])
        if (!cancelled) {
          setProduct(prod)
          setReviews(revs)
          setMyUserId(me?.id ?? null)

          const mine = me ? revs.find((r) => r.user === me.id) : undefined
          if (mine && !didPrefillReviewFormRef.current) {
            didPrefillReviewFormRef.current = true
            setReviewRating(mine.rating)
            setReviewTitle(mine.title)
            setReviewComment(mine.comment)
          }
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to load product'
        if (!cancelled) setError(message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [slug, isAuthenticated])

  async function handleAddToCart() {
    if (!product || addingToCart) return
    try {
      setAddingToCart(true)
      setAddSuccess(false)
      await addCartItem({
        product: product.id,
        quantity: 1,
        variant: selectedVariant?.id ?? null,
      })
      setAddSuccess(true)
      setTimeout(() => setAddSuccess(false), 2000)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to add to cart'
      setError(message)
    } finally {
      setAddingToCart(false)
    }
  }

  async function handleSubmitReview() {
    if (!product || !isAuthenticated || submittingReview) return

    const title = reviewTitle.trim()
    const comment = reviewComment.trim()
    const rating = Number(reviewRating)

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setReviewError('Rating must be between 1 and 5.')
      return
    }
    if (!title) {
      setReviewError('Title is required.')
      return
    }
    if (!comment) {
      setReviewError('Comment is required.')
      return
    }

    try {
      setSubmittingReview(true)
      setReviewError(null)
      setReviewSuccess(null)

      await submitReview({
        product: product.id,
        rating,
        title,
        comment,
      })

      setReviewTitle('')
      setReviewComment('')
      setReviewRating(5)
      setReviewSuccess('Thanks! Your review was submitted (it may require approval before appearing).')

      const revs = await listReviews(product.id)
      setReviews(revs)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to submit review'
      setReviewError(message)
    } finally {
      setSubmittingReview(false)
    }
  }

  async function handleDeleteMyReview() {
    if (!product || !isAuthenticated || !myUserId) return
    const mine = reviews.find((r) => r.user === myUserId)
    if (!mine) return

    try {
      setSubmittingReview(true)
      setReviewError(null)
      setReviewSuccess(null)

      await deleteReview(mine.id)

      setReviewTitle('')
      setReviewComment('')
      setReviewRating(5)
      setReviewSuccess('Your review was deleted.')

      const revs = await listReviews(product.id)
      setReviews(revs)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to delete review'
      setReviewError(message)
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) return <Loading label="Loading product…" />
  if (error) return <ErrorMessage message={error} />
  if (!product) return <div className="text-sm text-slate-600 dark:text-slate-300">Product not found.</div>

  const primaryImage = product.images?.find((img) => img.is_primary) ?? product.images?.[0]
  const effectivePrice =
    selectedVariant && Number(selectedVariant.price_adjustment) !== 0
      ? (Number(product.price) + Number(selectedVariant.price_adjustment)).toFixed(2)
      : product.price
  const effectiveStock = selectedVariant ? selectedVariant.stock : product.stock

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Image */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
          {primaryImage ? (
            <img
              src={primaryImage.image}
              alt={primaryImage.alt_text || product.name}
              className="h-auto w-full rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
              No image
            </div>
          )}
        </div>

        {/* Info */}
        <div className="grid gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
            {product.category_name && (
              <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{product.category_name}</div>
            )}
          </div>

          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-3xl font-bold">${effectivePrice}</span>
            {product.compare_price && Number(product.compare_price) > Number(effectivePrice) && (
              <span className="text-lg text-slate-500 line-through dark:text-slate-400">
                ${product.compare_price}
              </span>
            )}
            {product.is_on_sale && product.discount_percentage && (
              <span className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 dark:bg-red-900 dark:text-red-100">
                {product.discount_percentage}% OFF
              </span>
            )}
          </div>

          <div className="text-sm">
            <span className="font-medium">Stock:</span>{' '}
            <span className={effectiveStock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {effectiveStock > 0 ? `${effectiveStock} available` : 'Out of stock'}
            </span>
          </div>

          {product.short_description && (
            <p className="text-sm text-slate-700 dark:text-slate-200">{product.short_description}</p>
          )}

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="grid gap-2">
              <div className="text-sm font-semibold">Select Variant</div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedVariant(null)}
                  className={[
                    'rounded-md border px-3 py-2 text-sm font-medium',
                    !selectedVariant
                      ? 'border-sky-600 bg-sky-50 text-sky-700 dark:border-sky-500 dark:bg-sky-950 dark:text-sky-300'
                      : 'border-slate-300 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800',
                  ].join(' ')}
                >
                  Default
                </button>
                {product.variants
                  .filter((v) => v.is_active)
                  .map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={[
                        'rounded-md border px-3 py-2 text-sm font-medium',
                        selectedVariant?.id === v.id
                          ? 'border-sky-600 bg-sky-50 text-sky-700 dark:border-sky-500 dark:bg-sky-950 dark:text-sky-300'
                          : 'border-slate-300 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800',
                      ].join(' ')}
                    >
                      {v.value}
                      {Number(v.price_adjustment) !== 0 && (
                        <span className="ml-1 text-xs">
                          ({Number(v.price_adjustment) > 0 ? '+' : ''}
                          {v.price_adjustment})
                        </span>
                      )}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Add to Cart */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              disabled={!isAuthenticated || effectiveStock <= 0 || addingToCart}
              onClick={handleAddToCart}
              className="inline-flex h-10 items-center rounded-md bg-sky-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-sky-500"
            >
              {addingToCart ? 'Adding…' : 'Add to Cart'}
            </button>
            {addSuccess && (
              <span className="text-sm font-medium text-green-600 dark:text-green-400">Added to cart!</span>
            )}
            {!isAuthenticated && (
              <span className="text-sm text-slate-500 dark:text-slate-400">Login to purchase</span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-lg font-semibold">Description</h2>
          <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{product.description}</p>
        </div>
      )}

      {/* Attributes */}
      {product.attributes && product.attributes.length > 0 && (
        <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-lg font-semibold">Specifications</h2>
          <dl className="grid gap-2 text-sm">
            {product.attributes.map((attr) => (
              <div key={attr.id} className="grid grid-cols-3 gap-2">
                <dt className="font-medium text-slate-700 dark:text-slate-200">{attr.name}</dt>
                <dd className="col-span-2 text-slate-600 dark:text-slate-300">{attr.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Reviews */}
      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-lg font-semibold">Reviews ({reviews.length})</h2>

        {isAuthenticated ? (
          <div className="grid gap-3 rounded-md border border-slate-200 p-3 dark:border-slate-700">
            <div className="text-sm font-semibold">Write a review</div>

            {reviewError ? <ErrorMessage message={reviewError} /> : null}
            {reviewSuccess ? (
              <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
                {reviewSuccess}
              </div>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                <span className="text-slate-700 dark:text-slate-200">Rating</span>
                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value={5}>5</option>
                  <option value={4}>4</option>
                  <option value={3}>3</option>
                  <option value={2}>2</option>
                  <option value={1}>1</option>
                </select>
              </label>

              <label className="grid gap-1 text-sm">
                <span className="text-slate-700 dark:text-slate-200">Title</span>
                <input
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="Great product"
                />
              </label>
            </div>

            <label className="grid gap-1 text-sm">
              <span className="text-slate-700 dark:text-slate-200">Comment</span>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={4}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                placeholder="Share your experience…"
              />
            </label>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="inline-flex h-10 items-center rounded-md bg-sky-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-sky-500"
              >
                {submittingReview ? 'Submitting…' : 'Submit review'}
              </button>

              {myUserId && reviews.some((r) => r.user === myUserId) ? (
                <button
                  onClick={handleDeleteMyReview}
                  disabled={submittingReview}
                  className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  Delete my review
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-300">Login to write a review.</p>
        )}

        {reviews.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">No reviews yet.</p>
        ) : (
          <div className="grid gap-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-md border border-slate-200 p-3 dark:border-slate-700"
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <strong className="text-sm font-semibold">{review.title}</strong>
                  <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </span>
                </div>
                <p className="mb-2 text-sm text-slate-700 dark:text-slate-200">{review.comment}</p>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {review.user_name} • {new Date(review.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
