from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Role, Employee, EmployeeBranch, Shift, EmployeeShiftSchedule
from .serializers import (
    RoleSerializer,
    EmployeeSerializer,
    EmployeeBranchSerializer,
    ShiftSerializer,
    EmployeeShiftScheduleSerializer,
    CurrentUserSerializer,
    RegisterSerializer,
    UserAdminSerializer,
)

User = get_user_model()


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


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            user_data = CurrentUserSerializer(user).data
            return Response(
                {
                    "message": "Đăng ký tài khoản thành công.",
                    "user": user_data,
                    "tokens": {
                        "refresh": str(refresh),
                        "access": str(refresh.access_token),
                    },
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = UserAdminSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = User.objects.all().prefetch_related("employee_profile__role", "employee_profile__home_branch").order_by("-date_joined")
        role = self.request.query_params.get("role")
        search = self.request.query_params.get("search")
        is_active = self.request.query_params.get("is_active")

        if search:
            qs = qs.filter(
                Q(username__icontains=search)
                | Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(employee_profile__full_name__icontains=search)
                | Q(employee_profile__phone__icontains=search)
            )

        if role:
            if role == "admin":
                qs = qs.filter(Q(is_superuser=True) | Q(employee_profile__role__code="admin"))
            else:
                qs = qs.filter(employee_profile__role__code=role)

        if is_active is not None and is_active != "":
            active_bool = is_active.lower() in ["true", "1"]
            qs = qs.filter(is_active=active_bool)

        return qs

    def create(self, request, *args, **kwargs):
        payload = dict(request.data)
        if "branch_id" in request.data and "branch" not in payload:
            payload["branch"] = request.data["branch_id"]

        serializer = RegisterSerializer(data=payload)
        if serializer.is_valid():
            user = serializer.save()
            role_code = request.data.get("role", "user")
            if role_code == "admin":
                user.is_staff = True
                user.save()
            return Response(UserAdminSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        full_name = request.data.get("full_name")
        email = request.data.get("email")
        phone = request.data.get("phone")
        role_code = request.data.get("role")
        is_active = request.data.get("is_active")
        password = request.data.get("password")
        branch_id = request.data.get("branch_id")

        if email is not None:
            user.email = email
        if is_active is not None:
            user.is_active = bool(is_active)
        if full_name:
            user.first_name = full_name
        if password:
            user.set_password(password)

        if role_code == "admin":
            user.is_staff = True
        elif role_code in ["user", "receptionist", "manager"]:
            if not user.is_superuser:
                user.is_staff = False
        user.save()

        # Update or create employee profile
        import uuid
        employee, _ = Employee.objects.get_or_create(
            user=user,
            defaults={
                "employee_code": f"USR{uuid.uuid4().hex[:6].upper()}",
                "full_name": full_name or user.username,
                "email": user.email,
                "phone": phone or "",
            },
        )
        if full_name:
            employee.full_name = full_name
        if phone is not None:
            employee.phone = phone
        if email is not None:
            employee.email = email
        if role_code:
            target_role = Role.objects.filter(code=role_code).first()
            if target_role:
                employee.role = target_role

        if branch_id is not None:
            if branch_id == "" or branch_id == 0 or branch_id == "none" or branch_id is False:
                employee.home_branch = None
            else:
                from branches.models import Branch
                b = Branch.objects.filter(id=branch_id).first()
                if b:
                    employee.home_branch = b

        employee.save()

        return Response(UserAdminSerializer(user).data)

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user == request.user:
            return Response(
                {"detail": "Không thể xóa chính tài khoản bạn đang đăng nhập."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if user.is_superuser:
            return Response(
                {"detail": "Không thể xóa tài khoản Quản trị viên tối cao (Superuser)."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


