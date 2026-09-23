from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "username", "avatar", "created_at"]
        read_only_fields = ["id", "created_at"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["email", "username", "password"]

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Ya existe un usuario registrado con este correo electrónico.")
        return email

    def validate_username(self, value):
        username = value.strip()
        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError("Ya existe un usuario con este nombre de usuario.")
        return username

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data["email"].strip().lower(),
            username=validated_data["username"].strip(),
            password=validated_data["password"],
        )
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Permite login con email o con username, insensible a mayúsculas y quitando espacios."""

    def validate(self, attrs):
        raw_login = attrs.get(self.username_field, "").strip()

        # Buscar usuario coincidente por email o username
        user_match = User.objects.filter(email__iexact=raw_login).first()
        if not user_match:
            user_match = User.objects.filter(username__iexact=raw_login).first()

        if user_match:
            attrs[self.username_field] = user_match.email
        else:
            attrs[self.username_field] = raw_login

        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data
