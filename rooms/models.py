
from django.db import models
from django.conf import settings


class Room(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    slug = models.SlugField(unique=True)
    creator = models.CharField(max_length=100)
    # Храним список забаненных имен/никнеймов через запятую или JSON
    banned_users = models.TextField(default="", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Question(models.Model):
    room = models.ForeignKey(Room, related_name='questions', on_delete=models.CASCADE)
    text = models.CharField(max_length=255)

    # НОВЫЕ ПОЛЯ ДЛЯ УПРАВЛЕНИЯ
    is_active = models.BooleanField(default=True)  # True = Голосование идет, False = Стоп
    show_results = models.BooleanField(default=False)  # True = Показать всем итоги и имена

    def __str__(self):
        return self.text


class Choice(models.Model):
    question = models.ForeignKey(Question, related_name='choices', on_delete=models.CASCADE)
    text = models.CharField(max_length=200)

    @property
    def votes_count(self):
        return self.votes.count()

    def __str__(self):
        return self.text


class Vote(models.Model):
    choice = models.ForeignKey(Choice, related_name='votes', on_delete=models.CASCADE)
    # Связь с реальным юзером (если есть)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    # Или имя гостя
    voter_name = models.CharField(max_length=100, blank=True, null=True)
    # Или ник гостя (дублируем логику для надежности)
    guest_nickname = models.CharField(max_length=100, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Vote for {self.choice}"