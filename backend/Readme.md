# Django E-Commerce Application

A full-featured e-commerce backend application built with Django and Django REST Framework.

## Project Structure

```
backend/
├── manage.py                 # Django management script
├── requiremetns.txt         # Python dependencies
├── db.sqlite3              # SQLite database (development)
├── config/                 # Project configuration
│   ├── __init__.py
│   ├── asgi.py           # ASGI configuration
│   ├── wsgi.py           # WSGI configuration
│   └── urls.py           # Main URL configuration
├── settings/              # Settings modules
│   ├── __init__.py
│   ├── base.py          # Base settings
│   ├── development.py   # Development settings
│   ├── production.py    # Production settings
│   └── testing.py       # Testing settings
├── apps/                 # Django applications
│   ├── accounts/        # User accounts & authentication
│   │   ├── models.py   # User, Address, UserProfile models
│   │   ├── views.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── admin.py
│   ├── products/       # Product catalog
│   │   ├── models.py  # Product, Category, Brand, ProductImage, etc.
│   │   ├── views.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── admin.py
│   ├── cart/          # Shopping cart
│   │   ├── models.py # Cart, CartItem models
│   │   ├── views.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── admin.py
│   ├── orders/        # Order management
│   │   ├── models.py # Order, OrderItem, OrderStatusHistory models
│   │   ├── views.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── admin.py
│   ├── payments/      # Payment processing
│   │   ├── models.py # Payment model
│   │   ├── views.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── admin.py
│   ├── reviews/       # Product reviews
│   │   ├── models.py # Review, ReviewImage models
│   │   ├── views.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── admin.py
│   ├── wishlist/      # User wishlist
│   │   ├── models.py # Wishlist, WishlistItem models
│   │   ├── views.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── admin.py
│   └── notifications/ # User notifications
│       ├── models.py # Notification model
│       ├── views.py
│       ├── serializers.py
│       ├── urls.py
│       └── admin.py
├── utils/            # Utility modules
│   ├── __init__.py
│   ├── models.py    # Base models (TimeStampedModel)
│   ├── helpers.py   # Helper functions
│   ├── permissions.py # Custom permissions
│   ├── validators.py  # Custom validators
│   └── mixins.py      # Custom mixins
├── media/            # User uploaded files
│   ├── products/
│   ├── categories/
│   ├── brands/
│   ├── avatars/
│   └── reviews/
├── static/          # Static files (CSS, JS, images)
├── staticfiles/     # Collected static files (production)
├── docs/           # Documentation
└── tests        # Integration & E2E testing
    ├── conftest.py   # pytest fixtures
    ├── integration/
    └── __init__.py
```

## Features

### 1. User Management (accounts app)
- Custom user model with email authentication
- User profiles with additional information
- Multiple shipping/billing addresses per user
- User registration and authentication

### 2. Product Management (products app)
- Product catalog with categories and subcategories
- Product brands
- Product variants (size, color, etc.)
- Product attributes/specifications
- Multiple product images
- Stock management
- Featured products
- Product search and filtering

### 3. Shopping Cart (cart app)
- Add/remove items to cart
- Update item quantities
- Support for product variants
- Real-time price calculation
- Cart persistence

### 4. Order Management (orders app)
- Create orders from cart
- Order status tracking
- Order history
- Multiple order statuses (pending, confirmed, processing, shipped, delivered, cancelled, refunded)
- Order cancellation
- Shipping and billing addresses
- Tax and discount calculations

### 5. Payment Processing (payments app)
- Multiple payment methods support
- Payment status tracking
- Transaction history
- Integration ready for payment gateways (Stripe, PayPal, etc.)

### 6. Product Reviews (reviews app)
- Customer reviews and ratings
- Review images
- Verified purchase reviews
- Review moderation
- Helpful count

### 7. Wishlist (wishlist app)
- Save products for later
- Add/remove items from wishlist
- Quick view of saved products

### 8. Notifications (notifications app)
- Order status notifications
- Product restock notifications
- Price drop alerts
- Review approval notifications

## API Endpoints

### Accounts
- `POST /api/v1/accounts/token/` - Obtain auth token (DRF TokenAuthentication)
- `POST /api/v1/accounts/register/` - Register and obtain token
- `GET/POST /api/v1/accounts/users/` - User list/create
- `GET/PUT/PATCH/DELETE /api/v1/accounts/users/{id}/` - User detail
- `GET/POST /api/v1/accounts/addresses/` - Address list/create
- `GET/PUT/PATCH/DELETE /api/v1/accounts/addresses/{id}/` - Address detail
- `GET/POST /api/v1/accounts/profiles/` - Profile list/create

### Products
- `GET /api/v1/products/` - Product list
- `GET /api/v1/products/{slug}/` - Product detail
- `GET /api/v1/products/categories/` - Category list
- `GET /api/v1/products/brands/` - Brand list

### Cart
- `GET /api/v1/cart/` - Get cart
- `POST /api/v1/cart/add_item/` - Add item to cart
- `POST /api/v1/cart/remove_item/` - Remove item from cart
- `POST /api/v1/cart/clear/` - Clear cart

### Orders
- `GET/POST /api/v1/orders/` - Order list/create
- `GET /api/v1/orders/{id}/` - Order detail
- `POST /api/v1/orders/create_from_cart/` - Create order from cart
- `POST /api/v1/orders/{id}/cancel/` - Cancel order

### Payments
- `GET /api/v1/payments/` - Payment list
- `GET /api/v1/payments/{id}/` - Payment detail

### Reviews
- `GET/POST /api/v1/reviews/` - Review list/create
- `GET/PUT/PATCH/DELETE /api/v1/reviews/{id}/` - Review detail

### Wishlist
- `GET /api/v1/wishlist/` - Get wishlist
- `POST /api/v1/wishlist/add_item/` - Add item to wishlist
- `POST /api/v1/wishlist/remove_item/` - Remove item from wishlist

### Notifications
- `GET /api/v1/notifications/` - Notification list
- `POST /api/v1/notifications/{id}/mark_as_read/` - Mark as read
- `POST /api/v1/notifications/mark_all_as_read/` - Mark all as read

## Setup Instructions

### 1. Create Virtual Environment
```bash
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/Mac
```

### 2. Install Dependencies
```bash
pip install -r requiremetns.txt
```

### 3. Configure Settings
Update settings in `settings/development.py` or create a `.env` file for environment variables.

### 4. Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Create Superuser
```bash
python manage.py createsuperuser
```

### 6. Run Development Server
```bash
python manage.py runserver
```

### 7. Access Admin Panel
Visit `http://127.0.0.1:8000/admin/` and log in with your superuser credentials.

## Testing

Run tests with:
```bash
python manage.py test
```

## Deployment

For production deployment:
1. Set `DJANGO_SETTINGS_MODULE=config.settings.production`
2. Configure environment variables
3. Set up PostgreSQL database
4. Configure static/media file storage (AWS S3, etc.)
5. Set up SSL certificates
6. Use Gunicorn/uWSGI as WSGI server
7. Use Nginx as reverse proxy

## Technologies Used

- **Django 5.0+** - Web framework
- **Django REST Framework** - API development
- **PostgreSQL** - Database (production)
- **SQLite** - Database (development)
- **Pillow** - Image processing
- **django-cors-headers** - CORS handling
- **django-filter** - Filtering support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
