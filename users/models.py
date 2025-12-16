from django.db import models
from django.contrib.auth.models import AbstractUser



class User(AbstractUser):
    email = models.EmailField(unique=True)
    # Можно добавить аватарку или био позже

    USERNAME_FIELD = 'email'  # Логинимся по email
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email