from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

User = get_user_model()


class AuthTests(APITestCase):
    def setUp(self):
        # URL-адреса (стандартные пути Djoser)
        self.register_url = '/api/auth/users/'
        self.login_url = '/api/auth/jwt/create/'

        # Данные пользователя для тестов
        self.user_data = {
            'email': 'test@example.com',
            'username': 'testuser',
            'display_name': 'Tester',
            'password': 'StrongPassword123!',
            're_password': 'StrongPassword123!'
        }

    # --- ТЕСТЫ РЕГИСТРАЦИИ ---

    def test_registration_success(self):
        """Тест 1: Успешная регистрация при правильных данных"""
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['email'], self.user_data['email'])
        self.assertEqual(response.data['display_name'], self.user_data['display_name'])
        # Проверяем, что пользователь реально создался в БД
        self.assertTrue(User.objects.filter(email=self.user_data['email']).exists())

    def test_registration_password_mismatch(self):
        """Тест 2: Ошибка, если пароли не совпадают"""
        data = self.user_data.copy()
        data['re_password'] = 'WrongPassword'

        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Djoser обычно возвращает ошибку в поле 'non_field_errors' при несовпадении
        self.assertTrue('non_field_errors' in response.data or 're_password' in response.data)

    def test_registration_missing_field(self):
        """Тест 3: Ошибка, если не заполнено обязательное поле (например, email)"""
        data = self.user_data.copy()
        del data['email']

        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_registration_duplicate_email(self):
        """Тест 4: Ошибка при попытке зарегистрировать уже существующий email"""
        # Сначала создаем пользователя
        self.client.post(self.register_url, self.user_data)

        # Пытаемся создать снова с тем же email
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    # --- ТЕСТЫ ВХОДА (LOGIN) ---

    def test_login_success(self):
        """Тест 5: Успешный вход и получение токенов"""
        # Сначала регистрируем
        User.objects.create_user(
            email='login@test.com',
            username='loginuser',
            password='StrongPassword123!'
        )

        # Пытаемся войти
        login_data = {
            'email': 'login@test.com',
            'password': 'StrongPassword123!'
        }
        response = self.client.post(self.login_url, login_data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)  # Проверяем наличие access токена
        self.assertIn('refresh', response.data)  # Проверяем наличие refresh токена

    def test_login_wrong_password(self):
        """Тест 6: Ошибка входа при неверном пароле"""
        User.objects.create_user(
            email='login@test.com',
            username='loginuser',
            password='StrongPassword123!'
        )

        login_data = {
            'email': 'login@test.com',
            'password': 'WrongPassword'
        }
        response = self.client.post(self.login_url, login_data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_nonexistent_user(self):
        """Тест 7: Ошибка входа для несуществующего пользователя"""
        login_data = {
            'email': 'ghost@test.com',
            'password': 'password'
        }
        response = self.client.post(self.login_url, login_data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)