from rest_framework import viewsets, permissions
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Role, Employee, EmployeeBranch, Shift, EmployeeShiftSchedule
from .serializers import (
    RoleSerializer,
    EmployeeSerializer,
    EmployeeBranchSerializer,
    ShiftSerializer,
    EmployeeShiftScheduleSerializer,
    CurrentUserSerializer,
)


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all().order_by("name")
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    search_fields = ["code", "name"]


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.select_related("role", "home_branch", "user").all().order_by("employee_code")
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ["role", "home_branch", "is_active"]
    search_fields = ["employee_code", "full_name", "phone", "email", "user__username"]
    ordering_fields = ["employee_code", "full_name", "hire_date", "created_at"]


class EmployeeBranchViewSet(viewsets.ModelViewSet):
    queryset = EmployeeBranch.objects.select_related("employee", "branch").all().order_by("-assigned_from")
    serializer_class = EmployeeBranchSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ["employee", "branch"]


class ShiftViewSet(viewsets.ModelViewSet):
    queryset = Shift.objects.all().order_by("start_time")
    serializer_class = ShiftSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class EmployeeShiftScheduleViewSet(viewsets.ModelViewSet):
    queryset = (
        EmployeeShiftSchedule.objects.select_related("employee", "branch", "shift")
        .all()
        .order_by("-work_date", "shift__start_time")
    )
    serializer_class = EmployeeShiftScheduleSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ["employee", "branch", "shift", "status", "work_date"]
    search_fields = ["employee__full_name", "employee__employee_code"]
    ordering_fields = ["work_date", "status"]


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = CurrentUserSerializer(request.user)
        return Response(serializer.data)
