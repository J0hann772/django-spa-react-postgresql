from rest_framework.routers import DefaultRouter
from .views import RoomViewSet, VoteViewSet

router = DefaultRouter()
router.register(r'rooms', RoomViewSet)
router.register(r'votes', VoteViewSet)

urlpatterns = router.urls