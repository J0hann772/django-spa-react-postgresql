from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import User
from .models import Room, Question, Choice, RoomBan, Vote


class RoomTests(APITestCase):
    def setUp(self):
        # 1. Создаем тестовых пользователей
        # Владелец комнаты
        self.owner = User.objects.create_user(
            email='owner@test.com', username='owner',
            password='password', display_name='Owner'
        )
        # Пользователь, которого будем банить
        self.banned_user = User.objects.create_user(
            email='banned@test.com', username='banned',
            password='password', display_name='BannedGuy'
        )
        # Обычный пользователь
        self.regular_user = User.objects.create_user(
            email='user@test.com', username='user',
            password='password', display_name='RegularGuy'
        )

        # 2. Создаем комнату и контент
        self.room = Room.objects.create(title="Test Room", slug="test-room", creator="Owner")
        self.question = Question.objects.create(room=self.room, text="Question 1")
        self.choice1 = Choice.objects.create(question=self.question, text="Option A")

        # 3. Генерируем URL-адреса
        # URL для получения инфы о комнате (get)
        self.room_url = reverse('room-detail', kwargs={'slug': self.room.slug})

        # URL для бана пользователя (действие action: ban_user)
        # Если роутер DefaultRouter, имя обычно 'basename-actionname'
        self.ban_url = reverse('room-ban-user', kwargs={'slug': self.room.slug})

        # URL для голосования
        self.vote_url = "/api/votes/"

    def test_get_room_success(self):
        """Тест 1: Любой незабаненный может видеть комнату"""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(self.room_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], "Test Room")

    def test_ban_user_action(self):
        """Тест 2: Владелец может забанить пользователя, и создается запись в БД"""
        self.client.force_authenticate(user=self.owner)
        data = {"nickname": "BannedGuy"}

        response = self.client.post(self.ban_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Проверяем, что в таблице RoomBan появилась запись
        self.assertTrue(RoomBan.objects.filter(room=self.room, banned_identifier="BannedGuy").exists())

    def test_banned_user_cannot_view_room(self):
        """Тест 3: Забаненный пользователь получает 403 Forbidden при входе"""
        # Создаем бан заранее
        RoomBan.objects.create(room=self.room, banned_identifier="BannedGuy")

        # Пытаемся зайти под забаненным
        self.client.force_authenticate(user=self.banned_user)
        response = self.client.get(self.room_url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_guest_ban_check(self):
        """Тест 4: Гость с забаненным ником тоже получает 403"""
        RoomBan.objects.create(room=self.room, banned_identifier="TrollGuest")

        # Запрос без авторизации, но с параметром guest_name
        response = self.client.get(self.room_url, {'guest_name': 'TrollGuest'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_vote_creation(self):
        """Тест 5: Обычное голосование проходит успешно"""
        self.client.force_authenticate(user=self.regular_user)
        data = {"choice": self.choice1.id}

        response = self.client.post(self.vote_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Vote.objects.count(), 1)

    def test_banned_user_cannot_vote(self):
        """Тест 6: Забаненный пользователь не может проголосовать"""
        RoomBan.objects.create(room=self.room, banned_identifier="BannedGuy")
        self.client.force_authenticate(user=self.banned_user)

        data = {"choice": self.choice1.id}
        response = self.client.post(self.vote_url, data)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        # Голос не должен сохраниться
        self.assertEqual(Vote.objects.count(), 0)