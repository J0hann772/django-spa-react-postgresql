from djoser.serializers import UserCreateSerializer, UserSerializer
from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken, TokenError

User = get_user_model()

class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()

    def validate(self, attrs):
        self.token = attrs['refresh']
        return attrs

    def save(self, **kwargs):
        try:
            # Создаем объект RefreshToken из строки
            token = RefreshToken(self.token)
            # И отправляем его в черный список
            token.blacklist()
        except TokenError:
            pass

class CustomUserCreateSerializer(UserCreateSerializer):
    # Явно указываем, что поле обязательно (required=True)
    display_name = serializers.CharField(required=True, max_length=50)

    class Meta(UserCreateSerializer.Meta):
        model = User
        # Обязательно добавляем display_name в поля
        fields = tuple(UserCreateSerializer.Meta.fields) + ('display_name',)

class CustomUserSerializer(UserSerializer):
    class Meta(UserSerializer.Meta):
        model = User
        fields = ('id', 'email', 'username', 'display_name', 'is_staff')