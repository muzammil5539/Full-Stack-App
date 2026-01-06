# E-Commerce API Documentation

## Overview

This document provides comprehensive information about the E-Commerce API endpoints, request/response formats, and authentication.

## Base URL

```
http://localhost:8000/api/v1/
```

## Authentication

The API uses Token-based authentication. Include the token in the Authorization header:

```
Authorization: Token <your-token-here>
```

### Obtaining a Token

```http
POST /api/v1/auth/login/
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "password123"
}
```

Response:
```json
{
    "token": "your-auth-token",
    "user": {
        "id": 1,
        "email": "user@example.com",
        "username": "user"
    }
}
```

## Endpoints

### Products

#### List Products
```http
GET /api/v1/products/
```

Query parameters:
- `category`: Filter by category ID
- `brand`: Filter by brand ID
- `search`: Search in product name and description
- `ordering`: Sort by field (price, -price, created_at, -created_at)
- `page`: Page number
- `page_size`: Items per page

Response:
```json
{
    "count": 100,
    "next": "http://localhost:8000/api/v1/products/?page=2",
    "previous": null,
    "results": [
        {
            "id": 1,
            "name": "Product Name",
            "slug": "product-name",
            "description": "Product description",
            "price": "99.99",
            "compare_price": "129.99",
            "stock": 50,
            "category": 1,
            "category_name": "Electronics",
            "brand": 1,
            "brand_name": "Apple",
            "is_featured": true,
            "is_on_sale": true,
            "discount_percentage": 23,
            "images": [
                {
                    "id": 1,
                    "image": "/media/products/image.jpg",
                    "is_primary": true
                }
            ],
            "variants": [],
            "attributes": []
        }
    ]
}
```

#### Get Product Detail
```http
GET /api/v1/products/{slug}/
```

#### List Categories
```http
GET /api/v1/products/categories/
```

#### List Brands
```http
GET /api/v1/products/brands/
```

### Cart

#### Get Cart
```http
GET /api/v1/cart/
Authorization: Token <token>
```

Response:
```json
{
    "id": 1,
    "user": 1,
    "items": [
        {
            "id": 1,
            "product": 1,
            "product_details": {...},
            "variant": null,
            "quantity": 2,
            "price": "99.99",
            "subtotal": "199.98"
        }
    ],
    "total_price": "199.98",
    "total_items": 2
}
```

#### Add Item to Cart
```http
POST /api/v1/cart/add_item/
Authorization: Token <token>
Content-Type: application/json

{
    "product": 1,
    "variant": null,
    "quantity": 1
}
```

#### Remove Item from Cart
```http
POST /api/v1/cart/remove_item/
Authorization: Token <token>
Content-Type: application/json

{
    "item_id": 1
}
```

#### Clear Cart
```http
POST /api/v1/cart/clear/
Authorization: Token <token>
```

### Orders

#### List Orders
```http
GET /api/v1/orders/
Authorization: Token <token>
```

#### Get Order Detail
```http
GET /api/v1/orders/{id}/
Authorization: Token <token>
```

#### Create Order from Cart
```http
POST /api/v1/orders/create_from_cart/
Authorization: Token <token>
Content-Type: application/json

{
    "shipping_address": 1,
    "billing_address": 1,
    "shipping_cost": "10.00",
    "tax": "5.00",
    "discount": "0.00",
    "notes": "Please deliver after 5 PM"
}
```

Response:
```json
{
    "id": 1,
    "order_number": "ORD-ABC12345",
    "user": 1,
    "status": "pending",
    "items": [...],
    "subtotal": "199.98",
    "shipping_cost": "10.00",
    "tax": "5.00",
    "discount": "0.00",
    "total": "214.98",
    "created_at": "2026-01-06T10:00:00Z"
}
```

#### Cancel Order
```http
POST /api/v1/orders/{id}/cancel/
Authorization: Token <token>
Content-Type: application/json

{
    "notes": "Changed my mind"
}
```

### Reviews

#### List Reviews
```http
GET /api/v1/reviews/?product={product_id}
```

#### Create Review
```http
POST /api/v1/reviews/
Authorization: Token <token>
Content-Type: application/json

{
    "product": 1,
    "rating": 5,
    "title": "Great product!",
    "comment": "Really satisfied with this purchase."
}
```

### Wishlist

#### Get Wishlist
```http
GET /api/v1/wishlist/
Authorization: Token <token>
```

#### Add Item to Wishlist
```http
POST /api/v1/wishlist/add_item/
Authorization: Token <token>
Content-Type: application/json

{
    "product": 1
}
```

#### Remove Item from Wishlist
```http
POST /api/v1/wishlist/remove_item/
Authorization: Token <token>
Content-Type: application/json

{
    "product": 1
}
```

### Notifications

#### List Notifications
```http
GET /api/v1/notifications/
Authorization: Token <token>
```

#### Mark Notification as Read
```http
POST /api/v1/notifications/{id}/mark_as_read/
Authorization: Token <token>
```

#### Mark All Notifications as Read
```http
POST /api/v1/notifications/mark_all_as_read/
Authorization: Token <token>
```

## Status Codes

- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Permission denied
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Error Response Format

```json
{
    "error": "Error message here",
    "details": {
        "field": ["Error description"]
    }
}
```

## Rate Limiting

- Anonymous users: 100 requests per hour
- Authenticated users: 1000 requests per hour

## Pagination

All list endpoints support pagination with the following parameters:
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)

## Filtering and Search

Use query parameters to filter and search:
- `search`: Full-text search
- `ordering`: Sort results (prefix with `-` for descending)
- Field-specific filters vary by endpoint

## Webhooks

Coming soon: Webhook notifications for order status changes and payment events.
