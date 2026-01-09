type DocListItem = {
  name: string
  title: string
}

type DocDetail = {
  name: string
  title: string
  content_type: string
  content: string
}

export const frontendDocs: DocListItem[] = [
  { name: 'frontend:routes', title: 'Frontend: Routes' },
  { name: 'frontend:components', title: 'Frontend: Components' },
]

export function getFrontendDoc(name: string): DocDetail | null {
  if (name === 'frontend:routes') {
    const content = `# Frontend Routes\n\nThe main application routes (registered in src/app/AppRouter.tsx):\n\n- / — HomePage\n- /products — ProductsPage (list)\n- /products/:slug — ProductDetailPage\n- /cart — CartPage\n- /checkout — CheckoutPage\n- /orders — OrdersPage\n- /orders/:id — OrderDetailPage\n- /wishlist — WishlistPage\n- /notifications — NotificationsPage\n- /payments — PaymentsPage\n- /admin — AdminPage\n- /admin/docs/* — AdminDocsPage (backend docs)\n- /admin/:app/:model/* — Admin model CRUD pages\n- /account — AccountPage\n- /account/settings — SettingsPage\n- /account/login — LoginPage\n- /account/register — RegisterPage\n- * — NotFoundPage\n\nThese routes are rendered inside the RootLayout which provides header/footer/navigation.\n`
    return { name, title: 'Frontend Routes', content_type: 'text/markdown', content }
  }

  if (name === 'frontend:components') {
    const content = `# Frontend Components\n\nThis is a brief mapping of notable admin-facing components and pages:\n\n- src/layouts/RootLayout.tsx — site header/footer and main navigation.\n- src/pages/admin/AdminPage.tsx — Admin landing page with links to models.\n- src/pages/admin/AdminDocsPage.tsx — Proxy to backend /docs/ plus frontend docs.\n- src/pages/admin/AdminModelChangeListPage.tsx — Model listing and filters.\n- src/pages/admin/AdminModelEditPage.tsx — Edit form for a model instance.\n- src/pages/admin/AdminModelAddPage.tsx — Create form for model.\n- src/shared/ui/ErrorBoundary.tsx — Top-level error boundary used in RootLayout.\n- src/pages/NotificationsPage.tsx — Notifications list with a11y improvements.\n\nFor component-level docs, open the source files linked above.\n`
    return { name, title: 'Frontend Components', content_type: 'text/markdown', content }
  }

  return null
}
