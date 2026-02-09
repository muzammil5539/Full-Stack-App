from rest_framework import serializers
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model
from .models import User, Address, UserProfile
import json
from django.conf import settings
from urllib.request import urlopen


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 
                  'phone', 'avatar', 'is_verified']
        read_only_fields = ['id', 'is_verified']


class AddressSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Address
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class UserProfileSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = UserProfile
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class GoogleAuthSerializer(serializers.Serializer):
    """Serializer for Google OAuth authentication."""
    id_token = serializers.CharField()

    def validate_id_token(self, value):
        """
        Validate Google ID token by calling Google's tokeninfo endpoint.
        
        Args:
            value (str): The Google ID token from client.
            
        Returns:
            dict: Token payload with user data.
            
        Raises:
            serializers.ValidationError: If token is invalid or expired.
        """
        try:
            # Verify token with Google's tokeninfo endpoint
            response = urlopen(f'https://oauth2.googleapis.com/tokeninfo?id_token={value}')
            payload = json.loads(response.read())
            
            # Check for errors
            if 'error' in payload:
                raise serializers.ValidationError(f'Invalid token: {payload["error"]}')
            
            # Verify audience (client ID) matches
            if payload.get('aud') != settings.GOOGLE_OAUTH_CLIENT_ID:
                raise serializers.ValidationError('Token audience does not match Client ID')
            
            return payload
            
        except Exception as e:
            if isinstance(e, serializers.ValidationError):
                raise
            raise serializers.ValidationError(f'Token validation failed: {str(e)}')

    def create(self, validated_data):
        """
        Create or update user from Google token payload.
        
        Creates a new user if one doesn't exist, or updates existing user.
        Automatically creates auth token for the user.
        
        Returns:
            dict: User data and auth token.
        """
        payload = validated_data['id_token']
        
        email = payload.get('email')
        first_name = payload.get('given_name', '')
        last_name = payload.get('family_name', '')
        
        if not email:
            raise serializers.ValidationError('Email not found in token.')
        
        UserModel = get_user_model()
        user, created = UserModel.objects.get_or_create(
            email=email,
            defaults={
                'username': email.split('@')[0],
                'first_name': first_name,
                'last_name': last_name,
                'is_verified': True,
            }
        )
        
        # Update user if it exists
        if not created:
            user.first_name = first_name
            user.last_name = last_name
            user.is_verified = True
            user.save()
        
        # Create or get token
        auth_token, _ = Token.objects.get_or_create(user=user)
        
        return {
            'key': auth_token.key,
            'user': UserSerializer(user).data,
        }
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
