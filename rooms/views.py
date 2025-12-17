
from rest_framework import viewsets, permissions, filters, mixins
from .models import Room, Vote
from .serializers import RoomSerializer, VoteSerializer
from core.permissions import IsProfileComplete  # Наш кастомный пермишен


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    lookup_field = 'slug'  # Будем искать комнату по слагу (/api/rooms/my-party/)

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['created_at']

    def get_permissions(self):
        # Смотреть могут все
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]

        # Создавать/Удалять - только авторизованные с заполненным профилем
        return [permissions.IsAuthenticated(), IsProfileComplete()]

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)


class VoteViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    """
    API только для создания голоса (POST).
    """
    queryset = Vote.objects.all()
    serializer_class = VoteSerializer
    permission_classes = [permissions.AllowAny]  # Пускаем всех (логика проверки внутри сериализатора)