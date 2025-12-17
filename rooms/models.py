from django.db import models
from django.conf import settings

class Room(models.Model):
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='rooms')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    slug = models.SlugField(unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Question(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='questions')
    text = models.CharField(max_length=255)

    def __str__(self):
        return self.text

class Choice(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    text = models.CharField(max_length=255)
    votes_count = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.text} ({self.votes_count})"

class Vote(models.Model):
    """
    Запись о каждом конкретном голосе.
    Нужна, чтобы знать, кто проголосовал (юзер или гость).
    """
    choice = models.ForeignKey(Choice, on_delete=models.CASCADE, related_name='votes')
    # Если голосовал зарегистрированный
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    # Имя голосующего (либо из профиля юзера, либо введенное гостем)
    voter_name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)