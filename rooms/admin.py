from django.contrib import admin
from .models import Room, Question, Choice, Vote

# Позволяет добавлять варианты ответов прямо внутри вопроса
class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 2  # По умолчанию показывать 2 поля для ответов

class QuestionAdmin(admin.ModelAdmin):
    inlines = [ChoiceInline]
    list_display = ['text', 'room']

# Позволяет видеть вопросы внутри комнаты
class QuestionInline(admin.TabularInline):
    model = Question
    extra = 0
    show_change_link = True  # Кнопка "Редактировать", чтобы провалиться в вопрос и добавить ответы

class RoomAdmin(admin.ModelAdmin):
    inlines = [QuestionInline]
    list_display = ['title', 'creator', 'created_at', 'slug']
    prepopulated_fields = {'slug': ('title',)} # Автозаполнение слага

class VoteAdmin(admin.ModelAdmin):
    list_display = ['choice', 'voter_name', 'user', 'created_at']

# Регистрируем всё
admin.site.register(Room, RoomAdmin)
admin.site.register(Question, QuestionAdmin)
admin.site.register(Choice)
admin.site.register(Vote, VoteAdmin)