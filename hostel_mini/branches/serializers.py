from rest_framework import serializers
from .models import Branch


class BranchSerializer(serializers.ModelSerializer):
    rooms_count = serializers.SerializerMethodField()
    active_rooms_count = serializers.SerializerMethodField()
    manager_name = serializers.SerializerMethodField()

    class Meta:
        model = Branch
        fields = [
            "id",
            "code",
            "name",
            "address",
            "ward",
            "district",
            "province",
            "phone",
            "email",
            "total_floors",
            "image_url",
            "is_active",
            "rooms_count",
            "active_rooms_count",
            "manager_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_rooms_count(self, obj):
        return obj.rooms.count()

    def get_active_rooms_count(self, obj):
        return obj.rooms.filter(is_active=True).count()

    def get_manager_name(self, obj):
        mgr = obj.employees.filter(role__code="manager", is_active=True).first()
        return mgr.full_name if mgr else None
