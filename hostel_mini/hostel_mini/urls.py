"""
URL configuration for hostel_mini project.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from staff.views import CurrentUserView, RegisterView

urlpatterns = [
    path("admin/", admin.site.urls),
    # Authentication endpoints (JWT)
    path("api/auth/register/", RegisterView.as_view(), name="register"),
    path("api/auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/me/", CurrentUserView.as_view(), name="current_user"),
    # Business API endpoints
    path("api/branches/", include("branches.urls")),
    path("api/staff/", include("staff.urls")),
    path("api/customers/", include("customers.urls")),
    path("api/rooms/", include("rooms.urls")),
    path("api/bookings/", include("bookings.urls")),
    path("api/billing/", include("billing.urls")),
]

if settings.DEBUG or True:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

