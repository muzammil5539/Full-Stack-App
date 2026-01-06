# Database Schema

## Overview

This document describes the database schema for the e-commerce application.

## Entity Relationship Diagram

```
User ──┬─── UserProfile
       ├─── Address (multiple)
       ├─── Cart
       ├─── Order (multiple)
       ├─── Review (multiple)
       ├─── Wishlist
       └─── Notification (multiple)

Product ──┬─── ProductImage (multiple)
          ├─── ProductVariant (multiple)
          ├─── ProductAttribute (multiple)
          ├─── Review (multiple)
          ├─── CartItem (multiple)
          ├─── OrderItem (multiple)
          └─── WishlistItem (multiple)

Category ───── Product (multiple)
Brand ──────── Product (multiple)

Order ──┬─── OrderItem (multiple)
        ├─── Payment (multiple)
        └─── OrderStatusHistory (multiple)
```

## Tables

### users
Custom user model extending Django's AbstractUser.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PK, Auto | User ID |
| email | String(255) | Unique, Not Null | User email (login) |
| username | String(150) | Unique, Not Null | Username |
| first_name | String(150) | | First name |
| last_name | String(150) | | Last name |
| phone | String(20) | | Phone number |
| avatar | ImageField | Nullable | Profile picture |
| is_verified | Boolean | Default: False | Email verified |
| is_staff | Boolean | Default: False | Staff status |
| is_active | Boolean | Default: True | Active status |
| date_joined | DateTime | Auto | Registration date |

### user_profiles
Extended user profile information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PK, Auto | Profile ID |
| user_id | Integer | FK(users), Unique | User reference |
| date_of_birth | Date | Nullable | Birth date |
| bio | Text | | User bio |
| created_at | DateTime | Auto | Creation time |
| updated_at | DateTime | Auto | Last update |

### addresses
User addresses for shipping and billing.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PK, Auto | Address ID |
| user_id | Integer | FK(users) | User reference |
| address_type | String(10) | | billing/shipping |
| full_name | String(255) | Not Null | Recipient name |
| phone | String(20) | Not Null | Contact phone |
| address_line1 | String(255) | Not Null | Address line 1 |
| address_line2 | String(255) | | Address line 2 |
| city | String(100) | Not Null | City |
| state | String(100) | Not Null | State/Province |
| postal_code | String(20) | Not Null | Postal code |
| country | String(100) | Not Null | Country |
| is_default | Boolean | Default: False | Default address |
| created_at | DateTime | Auto | Creation time |
| updated_at | DateTime | Auto | Last update |

### categories
Product categories (hierarchical).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PK, Auto | Category ID |
| name | String(100) | Unique, Not Null | Category name |
| slug | String(100) | Unique, Not Null | URL slug |
| description | Text | | Description |
| parent_id | Integer | FK(categories), Nullable | Parent category |
| image | ImageField | Nullable | Category image |
| is_active | Boolean | Default: True | Active status |
| created_at | DateTime | Auto | Creation time |
| updated_at | DateTime | Auto | Last update |

### brands
Product brands.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PK, Auto | Brand ID |
| name | String(100) | Unique, Not Null | Brand name |
| slug | String(100) | Unique, Not Null | URL slug |
| description | Text | | Description |
| logo | ImageField | Nullable | Brand logo |
| is_active | Boolean | Default: True | Active status |
| created_at | DateTime | Auto | Creation time |
| updated_at | DateTime | Auto | Last update |

### products
Product catalog.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PK, Auto | Product ID |
| name | String(255) | Not Null | Product name |
| slug | String(255) | Unique, Not Null | URL slug |
| description | Text | Not Null | Full description |
| short_description | String(500) | | Short description |
| category_id | Integer | FK(categories) | Category |
| brand_id | Integer | FK(brands), Nullable | Brand |
| sku | String(100) | Unique, Not Null | Stock keeping unit |
| price | Decimal(10,2) | Not Null | Selling price |
| compare_price | Decimal(10,2) | Nullable | Original price |
| cost_price | Decimal(10,2) | Nullable | Cost price |
| stock | Integer | Default: 0 | Available stock |
| low_stock_threshold | Integer | Default: 5 | Low stock alert |
| weight | Decimal(10,2) | Nullable | Product weight |
| is_active | Boolean | Default: True | Active status |
| is_featured | Boolean | Default: False | Featured product |
| views_count | Integer | Default: 0 | View count |
| created_at | DateTime | Auto | Creation time |
| updated_at | DateTime | Auto | Last update |

### product_images
Product images.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PK, Auto | Image ID |
| product_id | Integer | FK(products) | Product reference |
| image | ImageField | Not Null | Image file |
| alt_text | String(255) | | Alt text |
| is_primary | Boolean | Default: False | Primary image |
| order | Integer | Default: 0 | Display order |
| created_at | DateTime | Auto | Creation time |
| updated_at | DateTime | Auto | Last update |

### product_variants
Product variants (size, color, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PK, Auto | Variant ID |
| product_id | Integer | FK(products) | Product reference |
| name | String(100) | Not Null | Variant type |
| value | String(100) | Not Null | Variant value |
| sku | String(100) | Unique, Not Null | Variant SKU |
| price_adjustment | Decimal(10,2) | Default: 0 | Price difference |
| stock | Integer | Default: 0 | Variant stock |
| is_active | Boolean | Default: True | Active status |
| created_at | DateTime | Auto | Creation time |
| updated_at | DateTime | Auto | Last update |

### product_attributes
Product specifications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PK, Auto | Attribute ID |
| product_id | Integer | FK(products) | Product reference |
| name | String(100) | Not Null | Attribute name |
| value | String(255) | Not Null | Attribute value |
| created_at | DateTime | Auto | Creation time |
| updated_at | DateTime | Auto | Last update |

### carts
Shopping carts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PK, Auto | Cart ID |
| user_id | Integer | FK(users), Unique | User reference |
| created_at | DateTime | Auto | Creation time |
| updated_at | DateTime | Auto | Last update |

### cart_items
Items in shopping cart.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PK, Auto | Item ID |
| cart_id | Integer | FK(carts) | Cart reference |
| product_id | Integer | FK(products) | Product reference |
| variant_id | Integer | FK(product_variants), Nullable | Variant reference |
| quantity | Integer | Default: 1 | Quantity |
| created_at | DateTime | Auto | Creation time |
| updated_at | DateTime | Auto | Last update |

**Unique constraint:** (cart_id, product_id, variant_id)

### orders
Customer orders.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PK, Auto | Order ID |
| order_number | String(100) | Unique, Not Null | Order number |
| user_id | Integer | FK(users) | Customer |
| status | String(20) | Not Null | Order status |
| shipping_address_id | Integer | FK(addresses), Nullable | Shipping address |
| billing_address_id | Integer | FK(addresses), Nullable | Billing address |
| subtotal | Decimal(10,2) | Not Null | Items subtotal |
| shipping_cost | Decimal(10,2) | Default: 0 | Shipping cost |
| tax | Decimal(10,2) | Default: 0 | Tax amount |
| discount | Decimal(10,2) | Default: 0 | Discount amount |
| total | Decimal(10,2) | Not Null | Total amount |
| notes | Text | | Order notes |
| tracking_number | String(255) | | Tracking number |
| created_at | DateTime | Auto | Order date |
| updated_at | DateTime | Auto | Last update |

### order_items
Items in an order.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PK, Auto | Item ID |
| order_id | Integer | FK(orders) | Order reference |
| product_id | Integer | FK(products) | Product reference |
| variant_id | Integer | FK(product_variants), Nullable | Variant reference |
| quantity | Integer | Not Null | Quantity ordered |
| price | Decimal(10,2) | Not Null | Unit price |
| subtotal | Decimal(10,2) | Not Null | Line total |
| created_at | DateTime | Auto | Creation time |
| updated_at | DateTime | Auto | Last update |

### order_status_history
Order status change history.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PK, Auto | History ID |
| order_id | Integer | FK(orders) | Order reference |
| status | String(20) | Not Null | Status |
| notes | Text | | Status notes |
| created_at | DateTime | Auto | Change time |
| updated_at | DateTime | Auto | Last update |

### payments
Payment transactions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PK, Auto | Payment ID |
| order_id | Integer | FK(orders) | Order reference |
| payment_method | String(20) | Not Null | Payment method |
| transaction_id | String(255) | Unique, Not Null | Transaction ID |
| amount | Decimal(10,2) | Not Null | Payment amount |
| status | String(20) | Default: pending | Payment status |
| payment_date | DateTime | Auto | Payment date |
| created_at | DateTime | Auto | Creation time |
| updated_at | DateTime | Auto | Last update |

### reviews
Product reviews.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PK, Auto | Review ID |
| product_id | Integer | FK(products) | Product reference |
| user_id | Integer | FK(users) | Reviewer |
| rating | Integer | 1-5 | Star rating |
| title | String(255) | Not Null | Review title |
| comment | Text | Not Null | Review text |
| is_verified_purchase | Boolean | Default: False | Verified buyer |
| is_approved | Boolean | Default: False | Approved status |
| helpful_count | Integer | Default: 0 | Helpful count |
| created_at | DateTime | Auto | Review date |
| updated_at | DateTime | Auto | Last update |

**Unique constraint:** (product_id, user_id)

### review_images
Images attached to reviews.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PK, Auto | Image ID |
| review_id | Integer | FK(reviews) | Review reference |
| image | ImageField | Not Null | Image file |
| created_at | DateTime | Auto | Upload time |
| updated_at | DateTime | Auto | Last update |

### wishlists
User wishlists.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PK, Auto | Wishlist ID |
| user_id | Integer | FK(users), Unique | User reference |
| created_at | DateTime | Auto | Creation time |
| updated_at | DateTime | Auto | Last update |

### wishlist_items
Items in wishlist.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PK, Auto | Item ID |
| wishlist_id | Integer | FK(wishlists) | Wishlist reference |
| product_id | Integer | FK(products) | Product reference |
| created_at | DateTime | Auto | Added time |
| updated_at | DateTime | Auto | Last update |

**Unique constraint:** (wishlist_id, product_id)

### notifications
User notifications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PK, Auto | Notification ID |
| user_id | Integer | FK(users) | User reference |
| notification_type | String(50) | Not Null | Notification type |
| title | String(255) | Not Null | Title |
| message | Text | Not Null | Message |
| is_read | Boolean | Default: False | Read status |
| url | URLField | | Related URL |
| created_at | DateTime | Auto | Creation time |
| updated_at | DateTime | Auto | Last update |

## Indexes

For optimal performance, consider adding indexes on:
- Foreign key columns
- Frequently queried columns (status, is_active, etc.)
- Slug fields
- Email fields
- Order numbers and transaction IDs
