# Google OAuth 2.0 Setup Guide

## Overview
This implementation provides secure Google OAuth 2.0 authentication for your e-commerce application. Users can now sign in with their real Gmail accounts, ensuring email authenticity.

## Backend Endpoints
- **Endpoint**: `POST /api/v1/accounts/auth/google/`
- **Request Body**: `{ "id_token": "<google_id_token>" }`
- **Response**: `{ "key": "<auth_token>", "user": {...} }`
- **Authentication**: Not required (AllowAny)
- **Rate Limiting**: 10 requests/minute (auth scope)

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requiremetns.txt
```

New packages installed:
- `dj-rest-auth>=5.0` - DRF OAuth helpers
- `django-allauth>=0.57` - OAuth provider framework
- `PyJWT>=2.8` - JWT token handling
- `google-auth-oauthlib>=1.0` - Google OAuth library

### 2. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable **Google+ API**
4. Go to **Credentials** → **Create OAuth 2.0 Client ID**
5. Choose **Web Application**
6. Add Authorized origins:
   - `http://localhost:3000` (frontend)
   - `http://localhost:5173` (Vite dev server)
   - `http://localhost:8000` (backend)
7. Add Authorized redirect URIs:
   - `http://localhost:3000/login`
   - `http://localhost:5173/login`
8. Copy the **Client ID** and **Client Secret**

### 3. Configure Backend

**Set environment variable:**
```bash
# Windows (PowerShell)
$env:GOOGLE_OAUTH_CLIENT_ID = "your_client_id_here"

# Linux/Mac
export GOOGLE_OAUTH_CLIENT_ID="your_client_id_here"
```

Or add to `.env` file in backend root:
```
GOOGLE_OAUTH_CLIENT_ID=your_client_id_here
```

**Run migrations:**
```bash
cd backend
python manage.py migrate
```

### 4. Configure Frontend

Update `frontend/.env.local`:
```
VITE_API_BASE_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your_client_id_here
```

### 5. Update Router

Add the Login route to your app router:

```typescript
// filepath: frontend/src/router.tsx
import { Login } from './pages/Login'

export const routes = [
  // ... other routes
  { path: '/login', element: <Login /> },
  // ... other routes
]
```

### 6. Wrap App with AuthProvider

```typescript
// filepath: frontend/src/main.tsx
import { AuthProvider } from './contexts/AuthContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
```

### 7. Protect Routes (Optional)

Create a ProtectedRoute component:

```typescript
// filepath: frontend/src/components/ProtectedRoute.tsx
import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} />
  }

  return <>{children}</>
}
```

Use it in routes:
```typescript
{ 
  path: '/dashboard', 
  element: <ProtectedRoute><Dashboard /></ProtectedRoute> 
}
```

## How It Works

### Authentication Flow

```
1. User clicks "Sign in with Google"
   ↓
2. Google Sign-In displays consent screen
   ↓
3. User grants permission
   ↓
4. Google returns ID Token to frontend
   ↓
5. Frontend sends ID Token to /api/v1/accounts/auth/google/
   ↓
6. Backend validates token signature against Google's public keys
   ↓
7. Backend creates/updates user from token payload
   ↓
8. Backend creates auth token
   ↓
9. Backend returns auth token + user data to frontend
   ↓
10. Frontend stores token in localStorage
```

### Token Validation

The backend:
1. Decodes the JWT token (without verification) to get the key ID
2. Fetches Google's public keys from `https://www.googleapis.com/oauth2/v1/certs`
3. Verifies the token signature using RS256 algorithm
4. Validates the `audience` claim matches your Client ID
5. Extracts user information (email, name, etc.)

### User Creation

- If user doesn't exist: Creates new user with email from token
- If user exists: Updates first/last name and marks as verified
- Automatically marks email as verified (verified by Google)
- Creates authentication token for session

## API Response Example

**Success Response:**
```json
{
  "key": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
  "user": {
    "id": 42,
    "email": "user@gmail.com",
    "username": "user",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "",
    "avatar": null,
    "is_verified": true,
    "is_staff": false,
    "is_superuser": false
  }
}
```

**Error Response:**
```json
{
  "error": "Authentication failed",
  "details": {
    "id_token": ["Token has expired."]
  }
}
```

## Using Auth Token in API Requests

After login, include the token in all authenticated requests:

```typescript
const response = await fetch(`${API_BASE_URL}/api/v1/products/`, {
  headers: {
    'Authorization': `Token ${token}`,
    'Content-Type': 'application/json'
  }
})
```

The `AuthContext` hook stores the token and user:

```typescript
import { useAuth } from './contexts/AuthContext'

function MyComponent() {
  const { user, token, isAuthenticated } = useAuth()
  
  if (!isAuthenticated) {
    return <div>Please log in</div>
  }
  
  return <div>Welcome, {user?.first_name}!</div>
}
```

## Security Features

✅ **Real Email Verification**: Only real Gmail accounts can sign in  
✅ **Token Signature Verification**: Backend verifies token with Google's public keys  
✅ **HTTPS in Production**: Always use HTTPS for OAuth  
✅ **CORS Protection**: Only allowed origins can access API  
✅ **Rate Limiting**: Auth endpoints throttled to 10 req/min  
✅ **Session Token**: Server-side token stored separately from JWT  

## Testing in Development

1. Start backend:
```bash
cd backend
python manage.py runserver
```

2. Start frontend:
```bash
cd frontend
npm run dev
```

3. Navigate to `http://localhost:5173/login`
4. Click "Sign in with Google"
5. Use your real Gmail account
6. You'll be redirected to dashboard after successful login

## Troubleshooting

**"Invalid token key"**
- Ensure `GOOGLE_OAUTH_CLIENT_ID` matches your OAuth app Client ID
- Verify token is freshly generated (tokens expire after 1 hour)

**"CORS error"**
- Check that your frontend URL is in `CORS_ALLOWED_ORIGINS`
- Verify frontend is accessing correct backend URL

**"Google Sign-In button not showing"**
- Ensure `VITE_GOOGLE_CLIENT_ID` is set in `.env.local`
- Check browser console for errors
- Verify Google's gsi script loaded in `index.html`

**"Token has expired"**
- Google ID tokens expire after 1 hour
- User needs to refresh by logging out and back in

## Production Checklist

- [ ] Set secure `SECRET_KEY` in settings
- [ ] Enable `DEBUG = False`
- [ ] Use HTTPS for all URLs
- [ ] Add production domain to Google OAuth credentials
- [ ] Remove debug print statements
- [ ] Configure proper email backend (replace console backend)
- [ ] Use environment variables for sensitive config
- [ ] Enable CSRF protection in frontend requests
- [ ] Set up proper CORS for production domain

## Additional Features

### Logout
```typescript
import { useAuth } from './contexts/AuthContext'

function LogoutButton() {
  const { logout } = useAuth()
  
  return (
    <button onClick={() => {
      logout()
      navigate('/login')
    }}>
      Logout
    </button>
  )
}
```

### Update HTTP Client with Auth Token

Modify your `frontend/src/api/http.ts` to include token:

```typescript
export async function getJson<T>(url: string): Promise<T> {
  const token = localStorage.getItem('authToken')
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  }
  
  if (token) {
    headers['Authorization'] = `Token ${token}`
  }
  
  const response = await fetchWithRetry(url, { headers })
  // ... rest of implementation
}
```

## References

- [Google Sign-In Documentation](https://developers.google.com/identity/gsi/web)
- [dj-rest-auth Documentation](https://dj-rest-auth.readthedocs.io/)
- [django-allauth Documentation](https://django-allauth.readthedocs.io/)
- [JWT Documentation](https://jwt.io/)
