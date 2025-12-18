from django.db import models
from django.conf import settings


class Room(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    slug = models.SlugField(unique=True)
    creator = models.CharField(max_length=100)
    # Поле banned_users удалено, теперь используется отдельная модель RoomBan
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class RoomBan(models.Model):
    """
    Отдельная модель для хранения банов.
    Позволяет удобно проверять, добавлять и удалять баны, не блокируя таблицу комнат.
    """
    room = models.ForeignKey(Room, related_name='bans', on_delete=models.CASCADE)
    # Кого забанили (никнейм или email)
    banned_identifier = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('room', 'banned_identifier')  # Чтобы нельзя было забанить дважды одного и того же
        ordering = ['-created_at']

    def __str__(self):
        return f"Ban: {self.banned_identifier} in {self.room.title}"


class Question(models.Model):
    room = models.ForeignKey(Room, related_name='questions', on_delete=models.CASCADE)
    text = models.CharField(max_length=255)

    is_active = models.BooleanField(default=True)
    show_results = models.BooleanField(default=False)

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
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    voter_name = models.CharField(max_length=100, blank=True, null=True)
    guest_nickname = models.CharField(max_length=100, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Vote for {self.choice}"