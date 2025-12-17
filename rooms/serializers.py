from rest_framework import serializers
from .models import Room, Question, Choice, Vote


# --- Вспомогательные сериализаторы ---
class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'text', 'votes_count']


class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)  # Вкладываем варианты

    class Meta:
        model = Question
        fields = ['id', 'text', 'choices']


# --- Основной сериализатор комнаты ---
class RoomSerializer(serializers.ModelSerializer):
    creator = serializers.StringRelatedField(read_only=True)  # Показываем имя создателя
    questions = QuestionSerializer(many=True, read_only=True)  # Вкладываем вопросы

    class Meta:
        model = Room
        fields = ['id', 'creator', 'title', 'description', 'slug', 'is_active', 'questions', 'created_at']


# --- Сериализатор для ГОЛОСОВАНИЯ ---
class VoteSerializer(serializers.ModelSerializer):
    # Поле только для записи (принимаем ник гостя)
    guest_nickname = serializers.CharField(required=False, write_only=True)

    class Meta:
        model = Vote
        fields = ['choice', 'guest_nickname']

    def validate(self, data):
        """
        ФЕЙС-КОНТРОЛЬ:
        1. Гость обязан представиться.
        2. Нельзя голосовать дважды в одном и том же вопросе.
        """
        user = self.context['request'].user
        nickname = data.get('guest_nickname')
        choice = data['choice']  # Тот вариант, за который хотят проголосовать
        question = choice.question  # Вопрос, к которому относится этот вариант

        # --- Проверка 1: Гость без имени ---
        if not user.is_authenticated and not nickname:
            raise serializers.ValidationError("Гость обязан представиться! Укажите поле guest_nickname.")

        # --- Проверка 2: Дубликаты (Самое важное) ---
        # Мы ищем в базе: есть ли уже голос (Vote), который:
        # а) Принадлежит этому юзеру (или этому нику)
        # б) Сделан за ЛЮБОЙ вариант ответа (choice) ВНУТРИ ЭТОГО ВОПРОСА (question)

        if user.is_authenticated:
            # Если это зарегистрированный пользователь
            has_voted = Vote.objects.filter(
                user=user,
                choice__question=question  # <-- Магия Django: ищем через связь choice -> question
            ).exists()
        else:
            # Если это гость (проверяем по нику)
            has_voted = Vote.objects.filter(
                voter_name=nickname,
                choice__question=question
            ).exists()

        if has_voted:
            raise serializers.ValidationError("Вы уже голосовали в этом вопросе! Хитрить нельзя.")

        return data

    def create(self, validated_data):
        user = self.context['request'].user
        nickname = validated_data.pop('guest_nickname', None)
        choice = validated_data['choice']

        # Определяем имя
        if user.is_authenticated:
            voter_name = user.display_name if user.display_name else user.email
            vote_user = user
        else:
            voter_name = nickname
            vote_user = None

        # 1. Создаем голос
        vote = Vote.objects.create(
            choice=choice,
            user=vote_user,
            voter_name=voter_name
        )

        # 2. Увеличиваем счетчик в варианте ответа (атомарно, чтобы не было гонок)
        from django.db.models import F
        choice.votes_count = F('votes_count') + 1
        choice.save()
        choice.refresh_from_db()  # Обновляем данные

        return vote