from django.db import IntegrityError, transaction
from rest_framework import status, viewsets, permissions
from rest_framework.response import Response
from .models import Review
from .serializers import ReviewSerializer


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = Review.objects.filter(is_approved=True)
        product_id = self.request.query_params.get('product', None)
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset

    def create(self, request, *args, **kwargs):
        # One review per (user, product). If it exists, update instead of 500ing.
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product = serializer.validated_data.get('product')
        if not product:
            return Response({'product': ['This field is required.']}, status=status.HTTP_400_BAD_REQUEST)

        try:
            existing = Review.objects.filter(user=request.user, product=product).first()

            with transaction.atomic():
                if existing:
                    update_serializer = self.get_serializer(existing, data=request.data, partial=True)
                    update_serializer.is_valid(raise_exception=True)
                    update_serializer.save(user=request.user)
                    return Response(update_serializer.data, status=status.HTTP_200_OK)

                serializer.save(user=request.user)
                headers = self.get_success_headers(serializer.data)
                return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

        except IntegrityError:
            return Response(
                {'detail': 'You have already reviewed this product.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
