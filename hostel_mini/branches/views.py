from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Branch
from .serializers import BranchSerializer


class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all().order_by("code")
    serializer_class = BranchSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ["is_active", "province", "district"]
    search_fields = ["code", "name", "address", "phone", "email"]
    ordering_fields = ["code", "name", "created_at"]

    @action(detail=False, methods=["post"], url_path="upload", permission_classes=[permissions.IsAuthenticatedOrReadOnly])
    def upload(self, request):
        file_obj = request.FILES.get("file") or request.FILES.get("image")
        if not file_obj:
            return Response({"error": "Vui lòng chọn tệp ảnh tải lên."}, status=status.HTTP_400_BAD_REQUEST)

        import os
        import uuid
        from django.conf import settings
        from django.core.files.storage import default_storage

        ext = os.path.splitext(file_obj.name)[1]
        unique_filename = f"{uuid.uuid4().hex[:12]}{ext}"
        rel_path = os.path.join("branches", unique_filename)
        saved_path = default_storage.save(rel_path, file_obj)
        image_url = request.build_absolute_uri(settings.MEDIA_URL + saved_path.replace("\\", "/"))
        return Response({"image_url": image_url}, status=status.HTTP_201_CREATED)
