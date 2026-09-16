from django.contrib.auth import get_user_model
from rest_framework import serializers
from branches.models import Branch
from .models import Role, Employee, EmployeeBranch, Shift, EmployeeShiftSchedule

User = get_user_model()


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ["id", "code", "name", "description"]


class ShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shift
        fields = ["id", "name", "start_time", "end_time"]


class EmployeeBranchSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    branch_code = serializers.CharField(source="branch.code", read_only=True)

    class Meta:
        model = EmployeeBranch
        fields = ["id", "employee", "branch", "branch_code", "branch_name", "assigned_from", "assigned_to"]


class EmployeeShiftScheduleSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)
    employee_code = serializers.CharField(source="employee.employee_code", read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    shift_name = serializers.CharField(source="shift.name", read_only=True)

    class Meta:
        model = EmployeeShiftSchedule
        fields = [
            "id",
            "employee",
            "employee_code",
            "employee_name",
            "branch",
            "branch_name",
            "shift",
            "shift_name",
            "work_date",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class EmployeeSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source="role.name", read_only=True)
    role_code = serializers.CharField(source="role.code", read_only=True)
    branch_name = serializers.CharField(source="home_branch.name", read_only=True)
    branch_code = serializers.CharField(source="home_branch.code", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Employee
        fields = [
            "id",
            "user",
            "username",
            "employee_code",
            "full_name",
            "phone",
            "email",
            "role",
            "role_code",
            "role_name",
            "home_branch",
            "branch_code",
            "branch_name",
            "avatar_url",
            "hire_date",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class CurrentUserSerializer(serializers.ModelSerializer):
    employee = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "is_staff", "is_superuser", "employee"]

    def get_employee(self, obj):
        try:
            employee = obj.employee_profile
            return {
                "id": employee.id,
                "employee_code": employee.employee_code,
                "full_name": employee.full_name,
                "phone": employee.phone,
                "role": employee.role.code if employee.role else None,
                "role_name": employee.role.name if employee.role else None,
                "branch_id": employee.home_branch_id,
                "branch_code": employee.home_branch.code if employee.home_branch else None,
                "branch_name": employee.home_branch.name if employee.home_branch else None,
                "avatar_url": employee.avatar_url,
            }
        except Employee.DoesNotExist:
            return None


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(min_length=3, max_length=50)
    password = serializers.CharField(write_only=True, min_length=6)
    email = serializers.EmailField(required=False, allow_blank=True, default="")
    full_name = serializers.CharField(max_length=150)
    phone = serializers.CharField(required=False, allow_blank=True, default="", max_length=20)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Tên đăng nhập này đã được sử dụng.")
        return value

    def create(self, validated_data):
        import uuid
        username = validated_data["username"]
        password = validated_data["password"]
        email = validated_data.get("email", "")
        full_name = validated_data["full_name"]
        phone = validated_data.get("phone", "")

        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            first_name=full_name,
        )

        code_suffix = uuid.uuid4().hex[:6].upper()
        employee_code = f"EMP{code_suffix}"

        role = Role.objects.filter(code="receptionist").first()
        if not role:
            role, _ = Role.objects.get_or_create(code="receptionist", defaults={"name": "Lễ tân"})

        home_branch = Branch.objects.filter(is_active=True).first()

        Employee.objects.create(
            user=user,
            employee_code=employee_code,
            full_name=full_name,
            email=email,
            phone=phone,
            role=role,
            home_branch=home_branch,
            is_active=True,
        )

        return user
