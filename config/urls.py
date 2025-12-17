# Файл: config/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    # 1. Авторизация (Djoser)
    path('api/auth/', include('djoser.urls')),
    path('api/auth/', include('djoser.urls.jwt')),

    # 2. Пользователи и Logout
    path('api/', include('users.urls')),

    # 3. Комнаты и голосование
    path('api/', include('rooms.urls')),
]