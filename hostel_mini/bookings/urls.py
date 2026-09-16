from rest_framework.routers import DefaultRouter
from .views import (
    BookingSourceViewSet,
    ServiceViewSet,
    BookingViewSet,
    BookingDetailViewSet,
)

app_name = "bookings"

router = DefaultRouter()
router.register(r"sources", BookingSourceViewSet, basename="booking-source")
router.register(r"services", ServiceViewSet, basename="service")
router.register(r"details", BookingDetailViewSet, basename="booking-detail")
router.register(r"bookings", BookingViewSet, basename="booking")

urlpatterns = router.urls