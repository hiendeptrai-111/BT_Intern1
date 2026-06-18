from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Book
from .serializers import BookSerializer
from .pagination import BookPagination


class BookListCreateAPIView(generics.ListCreateAPIView):
    """API: Lấy danh sách sách (GET) + Thêm sách mới (POST)."""
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    pagination_class = BookPagination

    def get_queryset(self):
        queryset = Book.objects.all()
        title = self.request.query_params.get('title')
        author = self.request.query_params.get('author')
        if title:
            queryset = queryset.filter(title__icontains=title)
        if author:
            queryset = queryset.filter(author__icontains=author)
        return queryset


class BookDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """API: Xem chi tiết (GET) / Sửa (PUT) / Xóa (DELETE) sách theo ID."""
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    lookup_field = 'id'


class LogoutView(APIView):
    """API: Đăng xuất — đưa refresh token vào blacklist."""

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'error': 'Refresh token is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {'message': 'Logout successful'},
                status=status.HTTP_200_OK
            )
        except Exception:
            return Response(
                {'error': 'Invalid token'},
                status=status.HTTP_400_BAD_REQUEST
            )
