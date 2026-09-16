from rest_framework import serializers
from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            "id",
            "full_name",
            "phone",
            "email",
            "id_card_number",
            "id_card_type",
            "date_of_birth",
            "nationality",
            "address",
            "note",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_phone(self, value):
        if value and not value.replace("+", "").replace(" ", "").replace("-", "").isdigit():
            raise serializers.ValidationError("Số điện thoại không hợp lệ.")
        return value
