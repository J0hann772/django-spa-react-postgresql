from rest_framework import viewsets, generics, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.exceptions import PermissionDenied
from .models import Room, Question, Vote, Choice
from .serializers import RoomSerializer, QuestionSerializer, VoteSerializer, ChoiceCreateSerializer


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all().order_by('-created_at')
    serializer_class = RoomSerializer
    lookup_field = 'slug'
    permission_classes = [IsAuthenticatedOrReadOnly]

    # --- ОБНОВЛЕННАЯ ПРОВЕРКА ВХОДА ---
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()

        # 1. Если пользователь авторизован - проверяем его аккаунт
        if request.user.is_authenticated:
            user_name = request.user.display_name or request.user.email
            if self.is_banned(instance, user_name):
                return Response({"detail": "Бан"}, status=status.HTTP_403_FORBIDDEN)

        # 2. Если гость - проверяем параметр guest_name из запроса
        else:
            guest_name = request.query_params.get('guest_name')
            if guest_name and self.is_banned(instance, guest_name):
                return Response(
                    {"detail": "Вы забанены в этой комнате."},
                    status=status.HTTP_403_FORBIDDEN
                )

        return super().retrieve(request, *args, **kwargs)

    # Вспомогательный метод проверки
    def is_banned(self, room, name):
        if hasattr(room, 'banned_users') and room.banned_users:
            banned_list = room.banned_users.split(',')
            return name in banned_list
        return False

    # ----------------------------------

    @action(detail=True, methods=['post'])
    def ban_user(self, request, slug=None):
        room = self.get_object()
        user_name = request.user.display_name if request.user.is_authenticated else "Guest"

        if room.creator != user_name and room.creator != request.user.email:
            raise PermissionDenied("Только создатель может банить!")

        target_name = request.data.get('nickname')
        if not target_name:
            return Response({"error": "Укажите ник"}, status=status.HTTP_400_BAD_REQUEST)

        if hasattr(room, 'banned_users'):
            banned_list = room.banned_users.split(',') if room.banned_users else []
            if target_name not in banned_list:
                banned_list.append(target_name)
                room.banned_users = ",".join(banned_list)
                room.save()

                # Удаляем все следы пользователя
                Vote.objects.filter(choice__question__room=room, guest_nickname=target_name).delete()
                Vote.objects.filter(choice__question__room=room, user__display_name=target_name).delete()
                Vote.objects.filter(choice__question__room=room, user__email=target_name).delete()

            return Response({"status": f"Пользователь {target_name} забанен."})
        return Response({"error": "Ошибка БД"}, status=500)

    def perform_create(self, serializer):
        user = self.request.user
        name_to_save = user.display_name if user.display_name else user.email
        serializer.save(**{'creator': name_to_save})


class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        room = serializer.validated_data['room']
        user = self.request.user
        user_name = user.display_name if user.display_name else user.email
        if room.creator != user_name:
            raise PermissionDenied("Нет прав!")
        serializer.save()

    def perform_update(self, serializer):
        if not self.request.user.is_authenticated:
            raise PermissionDenied("Нужна авторизация!")
        serializer.save()


class ChoiceViewSet(viewsets.ModelViewSet):
    queryset = Choice.objects.all()
    serializer_class = ChoiceCreateSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        question = serializer.validated_data['question']
        room = question.room
        user = self.request.user
        user_name = user.display_name if user.display_name else user.email
        if room.creator != user_name:
            raise PermissionDenied("Нет прав!")
        serializer.save()


class VoteCreateView(generics.CreateAPIView):
    queryset = Vote.objects.all()
    serializer_class = VoteSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            serializer.save()

    def post(self, request, *args, **kwargs):
        choice_id = request.data.get('choice')
        nickname = request.data.get('guest_nickname')
        current_name = nickname
        if request.user.is_authenticated:
            current_name = request.user.display_name

        if choice_id:
            try:
                choice_obj = Choice.objects.get(id=choice_id)
                room = choice_obj.question.room
                if hasattr(room, 'banned_users'):
                    banned_list = room.banned_users.split(',') if room.banned_users else []
                    if current_name and current_name in banned_list:
                        return Response({"detail": "Вы забанены!"}, status=status.HTTP_403_FORBIDDEN)
            except Exception:
                pass

        return super().post(request, *args, **kwargs)