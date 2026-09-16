from rest_framework.routers import DefaultRouter
from .views import (
    RoomTypeViewSet,
    RoomImageViewSet,
    RoomViewSet,
    SeasonViewSet,
    RoomPriceViewSet,
)

app_name = "rooms"

router = DefaultRouter()
router.register(r"types", RoomTypeViewSet, basename="room-type")
router.register(r"images", RoomImageViewSet, basename="room-image")
router.register(r"rooms", RoomViewSet, basename="room")
router.register(r"seasons", SeasonViewSet, basename="season")
router.register(r"prices", RoomPriceViewSet, basename="room-price")

urlpatterns = router.urls