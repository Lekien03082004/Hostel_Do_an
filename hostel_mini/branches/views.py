from rest_framework import viewsets, permissions
from .models import Branch
from .serializers import BranchSerializer


class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all().order_by("code")
    serializer_class = BranchSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ["is_active", "province", "district"]
    search_fields = ["code", "name", "address", "phone", "email"]
    ordering_fields = ["code", "name", "created_at"]
