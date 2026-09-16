from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    RoleViewSet,
    EmployeeViewSet,
    EmployeeBranchViewSet,
    ShiftViewSet,
    EmployeeShiftScheduleViewSet,
    CurrentUserView,
)

app_name = "staff"

router = DefaultRouter()
router.register(r"roles", RoleViewSet, basename="role")
router.register(r"employees", EmployeeViewSet, basename="employee")
router.register(r"assignments", EmployeeBranchViewSet, basename="employee-branch")
router.register(r"shifts", ShiftViewSet, basename="shift")
router.register(r"schedules", EmployeeShiftScheduleViewSet, basename="employee-schedule")

urlpatterns = [
    path("me/", CurrentUserView.as_view(), name="current_user"),
] + router.urls
