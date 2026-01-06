from rest_framework import serializers
from .models import Review, ReviewImage


class ReviewImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewImage
        fields = '__all__'


class ReviewSerializer(serializers.ModelSerializer):
    images = ReviewImageSerializer(many=True, read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = Review
        fields = '__all__'
        read_only_fields = ['id', 'user', 'is_verified_purchase', 'is_approved', 
                            'helpful_count', 'created_at', 'updated_at']
