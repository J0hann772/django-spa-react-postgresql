from rest_framework import viewsets, generics, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.exceptions import PermissionDenied
from .models import Room, Question, Vote
from .serializers import RoomSerializer, QuestionSerializer, VoteSerializer


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all().order_by('-created_at')
    serializer_class = RoomSerializer
    lookup_field = 'slug'
    permission_classes = [IsAuthenticatedOrReadOnly]

    @action(detail=True, methods=['post'])
    def ban_user(self, request, slug=None):
        room = self.get_object()
        user_name = request.user.display_name if request.user.is_authenticated else "Guest"

        # Проверяем права (создатель или админ)
        if room.creator != user_name and room.creator != request.user.email:
            raise PermissionDenied("Только создатель может банить!")

        target_name = request.data.get('nickname')
        if not target_name:
            return Response({"error": "Укажите ник"}, status=status.HTTP_400_BAD_REQUEST)

        # Безопасное добавление в бан-лист
        if hasattr(room, 'banned_users'):
            banned_list = room.banned_users.split(',') if room.banned_users else []
            if target_name not in banned_list:
                banned_list.append(target_name)
                room.banned_users = ",".join(banned_list)
                room.save()
            return Response({"status": f"Пользователь {target_name} забанен"})
        return Response({"error": "Поле banned_users отсутствует в модели"}, status=500)

    def perform_create(self, serializer):
        user = self.request.user
        # Берем имя или email
        name_to_save = user.display_name if user.display_name else user.email
        # Сохраняем creator вручную через kwargs, чтобы IDE не ругалась
        serializer.save(**{'creator': name_to_save})


class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_update(self, serializer):
        if not self.request.user.is_authenticated:
            raise PermissionDenied("Нужна авторизация!")
        serializer.save()


class VoteCreateView(generics.CreateAPIView):
    queryset = Vote.objects.all()
    serializer_class = VoteSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        choice_id = request.data.get('choice')
        nickname = request.data.get('guest_nickname')
        if request.user.is_authenticated:
            nickname = request.user.display_name

        if choice_id:
            try:
                from .models import Choice
                choice_obj = Choice.objects.get(id=choice_id)
                room = choice_obj.question.room

                # Проверка бана
                if hasattr(room, 'banned_users'):
                    banned_list = room.banned_users.split(',') if room.banned_users else []
                    if nickname and nickname in banned_list:
                        return Response({"detail": "Вы забанены!"}, status=status.HTTP_403_FORBIDDEN)
            except Exception:
                pass

        return super().post(request, *args, **kwargs)