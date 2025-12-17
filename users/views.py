from rest_framework import generics, status, permissions
from rest_framework.response import Response
from .serializers import LogoutSerializer

class LogoutView(generics.GenericAPIView):
    serializer_class = LogoutSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Просто валидируем и сохраняем (в сериализаторе происходит blacklist)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_204_NO_CONTENT)