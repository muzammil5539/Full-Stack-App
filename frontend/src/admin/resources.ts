export type AdminResource = {
  app: string
  model: string
  title: string
  apiPath: string // relative to API base url
  displayFieldCandidates?: string[]
}

export const ADMIN_RESOURCES: AdminResource[] = [
  { app: 'authtoken', model: 'token', title: 'Tokens', apiPath: '/api/v1/admin/authtoken/tokens/', displayFieldCandidates: ['key'] },
  { app: 'auth', model: 'group', title: 'Groups', apiPath: '/api/v1/admin/auth/groups/', displayFieldCandidates: ['name'] },

  { app: 'notifications', model: 'notification', title: 'Notifications', apiPath: '/api/v1/admin/notifications/notifications/', displayFieldCandidates: ['title'] },

  { app: 'orders', model: 'orderitem', title: 'Order Items', apiPath: '/api/v1/admin/orders/orderitems/', displayFieldCandidates: ['id'] },
  { app: 'orders', model: 'order', title: 'Orders', apiPath: '/api/v1/admin/orders/orders/', displayFieldCandidates: ['order_number', 'id'] },

  { app: 'payments', model: 'payment', title: 'Payments', apiPath: '/api/v1/admin/payments/payments/', displayFieldCandidates: ['transaction_id', 'id'] },

  { app: 'products', model: 'brand', title: 'Brands', apiPath: '/api/v1/admin/products/brands/', displayFieldCandidates: ['name', 'slug'] },
  { app: 'products', model: 'category', title: 'Categories', apiPath: '/api/v1/admin/products/categories/', displayFieldCandidates: ['name', 'slug'] },
  { app: 'products', model: 'productimage', title: 'Product Images', apiPath: '/api/v1/admin/products/productimages/', displayFieldCandidates: ['alt_text', 'id'] },
  { app: 'products', model: 'product', title: 'Products', apiPath: '/api/v1/admin/products/products/', displayFieldCandidates: ['name', 'sku', 'slug'] },

  { app: 'reviews', model: 'review', title: 'Reviews', apiPath: '/api/v1/admin/reviews/reviews/', displayFieldCandidates: ['title', 'id'] },

  { app: 'cart', model: 'cartitem', title: 'Cart Items', apiPath: '/api/v1/admin/cart/cartitems/', displayFieldCandidates: ['id'] },
  { app: 'cart', model: 'cart', title: 'Carts', apiPath: '/api/v1/admin/cart/carts/', displayFieldCandidates: ['id'] },

  { app: 'accounts', model: 'address', title: 'Addresses', apiPath: '/api/v1/admin/accounts/addresses/', displayFieldCandidates: ['full_name', 'city', 'id'] },
  { app: 'accounts', model: 'userprofile', title: 'User Profiles', apiPath: '/api/v1/admin/accounts/userprofiles/', displayFieldCandidates: ['id'] },
  { app: 'accounts', model: 'user', title: 'Users', apiPath: '/api/v1/admin/accounts/users/', displayFieldCandidates: ['email', 'username', 'id'] },

  { app: 'wishlist', model: 'wishlistitem', title: 'Wishlist Items', apiPath: '/api/v1/admin/wishlist/wishlistitems/', displayFieldCandidates: ['id'] },
  { app: 'wishlist', model: 'wishlist', title: 'Wishlists', apiPath: '/api/v1/admin/wishlist/wishlists/', displayFieldCandidates: ['id'] },
  
  { app: 'telemetry', model: 'telemetrytrace', title: 'Telemetry Traces', apiPath: '/api/v1/admin/telemetry/traces/', displayFieldCandidates: ['trace_id', 'username', 'root_span_name'] },
  { app: 'telemetry', model: 'telemetryspan', title: 'Telemetry Spans', apiPath: '/api/v1/admin/telemetry/spans/', displayFieldCandidates: ['span_id', 'name'] },
]

export function findAdminResource(app: string, model: string): AdminResource | undefined {
  const a = (app || '').toLowerCase()
  const m = (model || '').toLowerCase()
  return ADMIN_RESOURCES.find((r) => r.app === a && r.model === m)
}
