from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    email = models.EmailField(unique=True)
    # Наше новое поле для "Мягкого ограничения"
    display_name = models.CharField(max_length=50, blank=True, null=True, verbose_name="Отображаемое имя")

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'display_name'] # Добавили display_name

    def __str__(self):
        # Показываем ник, если есть, иначе email
        return self.display_name if self.display_name else self.email