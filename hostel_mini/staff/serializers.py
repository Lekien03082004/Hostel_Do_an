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
                "full_name": employee.full_name or obj.first_name or obj.username,
                "phone": employee.phone or "",
                "role": employee.role.code if employee.role else ("admin" if (obj.is_superuser or obj.is_staff) else "user"),
                "role_name": employee.role.name if employee.role else ("Quản trị viên" if (obj.is_superuser or obj.is_staff) else "Người dùng thường"),
                "branch_id": employee.home_branch_id,
                "branch_code": employee.home_branch.code if employee.home_branch else None,
                "branch_name": employee.home_branch.name if employee.home_branch else None,
                "avatar_url": employee.avatar_url,
            }
        except (AttributeError, Employee.DoesNotExist):
            return {
                "id": None,
                "employee_code": "ADMIN" if (obj.is_superuser or obj.is_staff) else "USER",
                "full_name": obj.first_name or obj.username,
                "phone": "",
                "role": "admin" if (obj.is_superuser or obj.is_staff) else "user",
                "role_name": "Quản trị viên" if (obj.is_superuser or obj.is_staff) else "Người dùng thường",
                "branch_id": None,
                "branch_code": None,
                "branch_name": "Hệ thống trung tâm",
                "avatar_url": None,
            }


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(min_length=3, max_length=50)
    password = serializers.CharField(write_only=True, min_length=6)
    email = serializers.EmailField(required=False, allow_blank=True, default="")
    full_name = serializers.CharField(max_length=150)
    phone = serializers.CharField(required=False, allow_blank=True, default="", max_length=20)
    role = serializers.CharField(required=False, default="user")
    branch = serializers.IntegerField(required=False, allow_null=True)

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
        role_code = validated_data.get("role", "user")
        branch_id = validated_data.get("branch")

        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            first_name=full_name,
        )

        code_suffix = uuid.uuid4().hex[:6].upper()
        if role_code == "user":
            prefix = "USR"
        elif role_code == "manager":
            prefix = "MGR"
        else:
            prefix = "EMP"
        employee_code = f"{prefix}{code_suffix}"

        role = Role.objects.filter(code=role_code).first()
        if not role:
            if role_code == "user":
                role, _ = Role.objects.get_or_create(code="user", defaults={"name": "Người dùng thường", "description": "Tài khoản khách hàng / thành viên thông thường"})
            elif role_code == "manager":
                role, _ = Role.objects.get_or_create(code="manager", defaults={"name": "Quản lý chi nhánh", "description": "Quản lý điều hành cơ sở / chi nhánh"})
            elif role_code == "receptionist":
                role, _ = Role.objects.get_or_create(code="receptionist", defaults={"name": "Lễ tân", "description": "Nhân viên lễ tân tiếp đón"})
            elif role_code == "admin":
                role, _ = Role.objects.get_or_create(code="admin", defaults={"name": "Quản trị viên", "description": "Toàn quyền quản trị hệ thống"})
            else:
                role, _ = Role.objects.get_or_create(code=role_code, defaults={"name": role_code.capitalize()})

        home_branch = None
        if branch_id:
            home_branch = Branch.objects.filter(id=branch_id).first()
        elif role_code in ["manager", "receptionist"]:
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

        # Create or sync customer profile if phone is provided
        if phone:
            from customers.models import Customer
            if not Customer.objects.filter(phone=phone).exists():
                Customer.objects.create(
                    full_name=full_name,
                    phone=phone,
                    email=email or None,
                    note="Tài khoản đăng ký trực tuyến",
                )

        return user


class UserAdminSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    role_code = serializers.SerializerMethodField()
    role_name = serializers.SerializerMethodField()
    branch_id = serializers.SerializerMethodField()
    branch_name = serializers.SerializerMethodField()
    employee_code = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "full_name",
            "phone",
            "is_staff",
            "is_superuser",
            "is_active",
            "date_joined",
            "last_login",
            "role_code",
            "role_name",
            "branch_id",
            "branch_name",
            "employee_code",
        ]

    def get_full_name(self, obj):
        try:
            return obj.employee_profile.full_name or obj.first_name or obj.username
        except (AttributeError, Employee.DoesNotExist):
            return obj.first_name or obj.username

    def get_phone(self, obj):
        try:
            return obj.employee_profile.phone or ""
        except (AttributeError, Employee.DoesNotExist):
            return ""

    def get_role_code(self, obj):
        try:
            if obj.employee_profile and obj.employee_profile.role:
                return obj.employee_profile.role.code
        except (AttributeError, Employee.DoesNotExist):
            pass
        return "admin" if (obj.is_superuser or obj.is_staff) else "user"

    def get_role_name(self, obj):
        try:
            if obj.employee_profile and obj.employee_profile.role:
                return obj.employee_profile.role.name
        except (AttributeError, Employee.DoesNotExist):
            pass
        return "Quản trị viên" if (obj.is_superuser or obj.is_staff) else "Người dùng thường"

    def get_branch_id(self, obj):
        try:
            return obj.employee_profile.home_branch_id
        except (AttributeError, Employee.DoesNotExist):
            return None

    def get_branch_name(self, obj):
        try:
            if obj.employee_profile and obj.employee_profile.home_branch:
                return obj.employee_profile.home_branch.name
            if obj.is_superuser or obj.is_staff:
                return "Toàn hệ thống"
            return "—"
        except (AttributeError, Employee.DoesNotExist):
            return "Toàn hệ thống" if (obj.is_superuser or obj.is_staff) else "—"

    def get_employee_code(self, obj):
        try:
            return obj.employee_profile.employee_code
        except (AttributeError, Employee.DoesNotExist):
            return "ADMIN" if obj.is_superuser else "USER"
