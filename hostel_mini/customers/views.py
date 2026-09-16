from rest_framework import viewsets, permissions
from .models import Customer
from .serializers import CustomerSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by("-created_at")
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ["id_card_type", "nationality"]
    search_fields = ["full_name", "phone", "email", "id_card_number"]
    ordering_fields = ["full_name", "created_at"]
