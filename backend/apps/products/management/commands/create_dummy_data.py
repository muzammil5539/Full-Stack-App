from django.core.management.base import BaseCommand
from django.utils.text import slugify

from apps.products.models import Category, Brand, Product, ProductVariant


class Command(BaseCommand):
    help = 'Create minimal dummy data for local development (categories, brands, products, variants)'

    def handle(self, *args, **options):
        created = {'categories': 0, 'brands': 0, 'products': 0, 'variants': 0}

        # Categories
        cats = [
            {'name': 'Clothing', 'slug': 'clothing', 'description': 'Apparel and garments'},
            {'name': 'Accessories', 'slug': 'accessories', 'description': 'Bags, hats, and more'},
            {'name': 'Home', 'slug': 'home', 'description': 'Home goods and decor'},
        ]

        for c in cats:
            obj, created_flag = Category.objects.get_or_create(slug=c['slug'], defaults={'name': c['name'], 'description': c['description']})
            if created_flag:
                created['categories'] += 1

        # Brands
        brands = [
            {'name': 'ZeroLife', 'slug': 'zerolife', 'description': 'Modern lifestyle brand'},
            {'name': 'StudioMade', 'slug': 'studiomade', 'description': 'Design-forward essentials'},
        ]

        for b in brands:
            obj, created_flag = Brand.objects.get_or_create(slug=b['slug'], defaults={'name': b['name'], 'description': b['description']})
            if created_flag:
                created['brands'] += 1

        # Products
        sample_products = [
            {
                'name': 'Everyday Tee',
                'slug': 'everyday-tee',
                'description': 'Comfortable, breathable cotton tee for everyday wear.',
                'short_description': 'Soft cotton tee',
                'category_slug': 'clothing',
                'brand_slug': 'zerolife',
                'sku': 'TEE-001',
                'price': '24.00',
                'compare_price': '34.00',
                'stock': 50,
                'is_featured': True,
            },
            {
                'name': 'Minimal Backpack',
                'slug': 'minimal-backpack',
                'description': 'Sleek pack for work and travel.',
                'short_description': 'Compact, durable pack',
                'category_slug': 'accessories',
                'brand_slug': 'studiomade',
                'sku': 'BAG-001',
                'price': '79.00',
                'compare_price': None,
                'stock': 20,
                'is_featured': True,
            },
            {
                'name': 'Ceramic Mug',
                'slug': 'ceramic-mug',
                'description': 'Hand-finished ceramic mug.',
                'short_description': '12oz ceramic mug',
                'category_slug': 'home',
                'brand_slug': None,
                'sku': 'MUG-001',
                'price': '14.00',
                'compare_price': '18.00',
                'stock': 100,
                'is_featured': False,
            },
        ]

        for p in sample_products:
            try:
                category = Category.objects.get(slug=p['category_slug'])
            except Category.DoesNotExist:
                category = Category.objects.first()

            brand = None
            if p.get('brand_slug'):
                try:
                    brand = Brand.objects.get(slug=p['brand_slug'])
                except Brand.DoesNotExist:
                    brand = None

            prod, created_flag = Product.objects.get_or_create(
                sku=p['sku'],
                defaults={
                    'name': p['name'],
                    'slug': p['slug'] or slugify(p['name']),
                    'description': p['description'],
                    'short_description': p.get('short_description') or '',
                    'category': category,
                    'brand': brand,
                    'price': p['price'],
                    'compare_price': p['compare_price'],
                    'stock': p.get('stock', 0),
                    'is_featured': p.get('is_featured', False),
                },
            )
            if created_flag:
                created['products'] += 1

            # create a couple of simple variants for apparel/backpack
            if prod.category.slug == 'clothing' and not prod.variants.exists():
                vs = [
                    {'name': 'Size', 'value': 'S', 'sku': f"{prod.sku}-S", 'stock': 10},
                    {'name': 'Size', 'value': 'M', 'sku': f"{prod.sku}-M", 'stock': 20},
                ]
                for v in vs:
                    var_obj, var_created = ProductVariant.objects.get_or_create(
                        sku=v['sku'],
                        defaults={
                            'product': prod,
                            'name': v['name'],
                            'value': v['value'],
                            'price_adjustment': 0,
                            'stock': v['stock'],
                        },
                    )
                    if var_created:
                        created['variants'] += 1

        self.stdout.write(self.style.SUCCESS('Dummy data creation complete:'))
        for k, v in created.items():
            self.stdout.write(f"  {k}: {v}")
