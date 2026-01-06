# Django E-Commerce Project

A modern full-stack e-commerce application with Django REST Framework backend and React frontend.

## Project Overview

This is a complete e-commerce solution featuring:
- User authentication and authorization
- Product catalog with categories and brands
- Shopping cart functionality
- Order management system
- Payment processing
- Product reviews and ratings
- Wishlist functionality
- User notifications
- Admin dashboard

## Project Structure

```
Django practice/
├── backend/              # Django REST Framework backend
│   ├── apps/            # Django applications
│   ├── config/          # Project configuration
│   ├── settings/        # Environment-specific settings
│   ├── utils/           # Utility modules
│   ├── media/           # User uploads
│   ├── static/          # Static files
│   ├── docs/            # Documentation
│   ├── unittests/       # Unit tests
│   ├── manage.py
│   └── requiremetns.txt
├── frontend/            # React frontend (to be implemented)
│   └── Readme.md
└── Readme.md           # This file
```

## Getting Started

### Backend Setup

See [backend/Readme.md](backend/Readme.md) for detailed backend setup instructions.

Quick start:
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requiremetns.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend Setup

See [frontend/Readme.md](frontend/Readme.md) for frontend setup instructions.

## API Documentation

The API follows RESTful principles and includes endpoints for:
- User management
- Product catalog
- Shopping cart
- Orders
- Payments
- Reviews
- Wishlist
- Notifications

Base URL: `http://localhost:8000/api/v1/`

## Features

### Backend Features
✅ User authentication with JWT
✅ Product management with categories
✅ Shopping cart with sessions
✅ Order processing
✅ Payment integration ready
✅ Product reviews and ratings
✅ Wishlist functionality
✅ Email notifications
✅ Admin dashboard
✅ RESTful API

### Frontend Features (Coming Soon)
- Modern React UI
- Responsive design
- Product browsing
- Shopping cart
- Checkout process
- User dashboard
- Order tracking

## Tech Stack

### Backend
- Django 5.0+
- Django REST Framework
- PostgreSQL / SQLite
- Pillow (Image processing)
- CORS headers

### Frontend
- React.js
- Redux/Context API
- Axios
- React Router
- Material-UI / Tailwind CSS

## Development

### Running Tests
```bash
cd backend
python manage.py test
```

### Code Style
- Follow PEP 8 for Python code
- Use ESLint for JavaScript/React code

## Deployment

### Backend Deployment
- Use Gunicorn/uWSGI as WSGI server
- Nginx as reverse proxy
- PostgreSQL database
- AWS S3 for static/media files
- Environment variables for sensitive data

### Frontend Deployment
- Build production bundle
- Deploy to Netlify/Vercel
- Configure API endpoints

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Contact

For questions or support, please open an issue in the repository.
