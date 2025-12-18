from django.contrib import admin
from .models import Room, Question, Choice, Vote, RoomBan

class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 2

class QuestionAdmin(admin.ModelAdmin):
    inlines = [ChoiceInline]
    list_display = ['text', 'room']

class QuestionInline(admin.TabularInline):
    model = Question
    extra = 0
    show_change_link = True

# Инлайн для просмотра банов прямо внутри комнаты
class RoomBanInline(admin.TabularInline):
    model = RoomBan
    extra = 0
    readonly_fields = ['created_at']

class RoomAdmin(admin.ModelAdmin):
    inlines = [QuestionInline, RoomBanInline] # Добавили баны сюда
    list_display = ['title', 'creator', 'created_at', 'slug']
    prepopulated_fields = {'slug': ('title',)}

class VoteAdmin(admin.ModelAdmin):
    list_display = ['choice', 'voter_name', 'user', 'created_at']

admin.site.register(Room, RoomAdmin)
admin.site.register(Question, QuestionAdmin)
admin.site.register(Choice)
admin.site.register(Vote, VoteAdmin)
# Можно зарегистрировать отдельно, если нужно
admin.site.register(RoomBan)