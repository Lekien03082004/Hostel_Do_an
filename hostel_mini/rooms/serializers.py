from rest_framework import serializers
from .models import RoomType, RoomImage, Room, Season, RoomPrice


class RoomImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomImage
        fields = [
            "id",
            "room_type",
            "branch",
            "image_url",
            "is_primary",
            "sort_order",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class RoomTypeSerializer(serializers.ModelSerializer):
    images = RoomImageSerializer(many=True, read_only=True)

    class Meta:
        model = RoomType
        fields = [
            "id",
            "name",
            "description",
            "max_occupancy",
            "bed_type",
            "area_sqm",
            "images",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class RoomSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    branch_code = serializers.CharField(source="branch.code", read_only=True)
    room_type_name = serializers.CharField(source="room_type.name", read_only=True)
    max_occupancy = serializers.IntegerField(source="room_type.max_occupancy", read_only=True)

    class Meta:
        model = Room
        fields = [
            "id",
            "branch",
            "branch_code",
            "branch_name",
            "room_type",
            "room_type_name",
            "max_occupancy",
            "room_number",
            "floor",
            "status",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class SeasonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Season
        fields = [
            "id",
            "name",
            "start_date",
            "end_date",
            "priority",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, data):
        if data.get("end_date") and data.get("start_date"):
            if data["end_date"] < data["start_date"]:
                raise serializers.ValidationError({"end_date": "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu."})
        return data


class RoomPriceSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    branch_code = serializers.CharField(source="branch.code", read_only=True)
    room_type_name = serializers.CharField(source="room_type.name", read_only=True)
    season_name = serializers.CharField(source="season.name", read_only=True)

    class Meta:
        model = RoomPrice
        fields = [
            "id",
            "branch",
            "branch_code",
            "branch_name",
            "room_type",
            "room_type_name",
            "season",
            "season_name",
            "rate_type",
            "price",
            "first_hours",
            "extra_hour_price",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
