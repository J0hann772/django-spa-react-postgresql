from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RoomViewSet, QuestionViewSet, VoteCreateView

# Создаем роутер и регистрируем ViewSets
router = DefaultRouter()
router.register(r'rooms', RoomViewSet)
router.register(r'questions', QuestionViewSet)

# Определяем urlpatterns (ОБЯЗАТЕЛЬНО должна быть эта переменная)
urlpatterns = [
    # Подключаем маршруты роутера (api/rooms/, api/questions/)
    path('', include(router.urls)),

    # Отдельный маршрут для голосования
    path('votes/', VoteCreateView.as_view(), name='create-vote'),
]