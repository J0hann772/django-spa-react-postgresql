from rest_framework import permissions


class IsProfileComplete(permissions.BasePermission):
    """
    Разрешает доступ только тем, у кого заполнено display_name.
    """
    message = "Для выполнения этого действия необходимо заполнить отображаемое имя в профиле."

    def has_permission(self, request, view):
        # Анонимов и гостей мы не проверяем здесь (их проверит IsAuthenticated в другом месте)
        if not request.user or not request.user.is_authenticated:
            return True

        # Проверяем, есть ли имя
        return bool(request.user.display_name)