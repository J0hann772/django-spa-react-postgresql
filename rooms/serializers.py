from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Room, Question, Choice, Vote

User = get_user_model()


class ChoiceSerializer(serializers.ModelSerializer):
    votes_count = serializers.SerializerMethodField()
    voters = serializers.SerializerMethodField()

    class Meta:
        model = Choice
        fields = ['id', 'text', 'votes_count', 'voters']

    def get_votes_count(self, obj):
        return obj.votes.count()

    def get_voters(self, obj):
        request = self.context.get('request')
        user = request.user if request else None

        # Определяем создателя (Хоста)
        room_creator = obj.question.room.creator
        is_creator = False
        if user and user.is_authenticated:
            # Сравниваем display_name или email
            current_name = user.display_name if user.display_name else user.email
            is_creator = (current_name == room_creator) or (user.email == room_creator)

        # Показываем список проголосовавших, если это Хост ИЛИ результаты открыты всем
        if is_creator or obj.question.show_results:
            voters_list = []
            for vote in obj.votes.all():
                if vote.user:
                    name = vote.user.display_name if vote.user.display_name else vote.user.email
                    is_guest = False
                else:
                    name = vote.guest_nickname or vote.voter_name or "Аноним"
                    is_guest = True

                voters_list.append({
                    "name": name,
                    "choice": obj.text,
                    "is_guest": is_guest
                })
            return voters_list
        return []


class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)
    room = serializers.PrimaryKeyRelatedField(queryset=Room.objects.all())
    user_voted_choice = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = ['id', 'room', 'text', 'choices', 'is_active', 'show_results', 'user_voted_choice']

    def get_user_voted_choice(self, obj):
        request = self.context.get('request')
        if not request: return None

        user = request.user
        guest_name = request.query_params.get('guest_name')

        vote = None
        if user and user.is_authenticated:
            vote = Vote.objects.filter(choice__question=obj, user=user).first()
        elif guest_name:
            vote = Vote.objects.filter(choice__question=obj, guest_nickname=guest_name).first()

        return vote.choice.id if vote else None


class RoomSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    creator = serializers.CharField(read_only=True)

    class Meta:
        model = Room
        fields = ['id', 'title', 'description', 'slug', 'creator', 'questions', 'created_at']


class VoteSerializer(serializers.ModelSerializer):
    # ИСПРАВЛЕНИЕ: Добавили allow_null=True
    guest_nickname = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Vote
        fields = ['id', 'choice', 'guest_nickname', 'user']

    def validate(self, data):
        user = self.context['request'].user
        nickname = data.get('guest_nickname')
        choice = data['choice']
        question = choice.question

        if not question.is_active:
            raise serializers.ValidationError("Голосование остановлено создателем.")

        # Логика проверки имени
        if not user.is_authenticated:
            if not nickname:
                raise serializers.ValidationError("Гость должен представиться!")
            if User.objects.filter(display_name__iexact=nickname).exists():
                raise serializers.ValidationError("Это имя занято зарегистрированным пользователем.")

        # Проверка на повторное голосование
        if user.is_authenticated:
            has_voted = Vote.objects.filter(user=user, choice__question=question).exists()
        else:
            has_voted = Vote.objects.filter(guest_nickname=nickname, choice__question=question).exists()

        if has_voted:
            raise serializers.ValidationError({"non_field_errors": ["Вы уже голосовали в этом вопросе!"]})

        return data

    def create(self, validated_data):
        user = self.context['request'].user
        if user.is_authenticated:
            validated_data['user'] = user
        return super().create(validated_data)


class ChoiceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'question', 'text']