from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from . import views

urlpatterns = [
    # Auth endpoints
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', views.LogoutView.as_view(), name='logout'),

    # Book CRUD endpoints
    path('books/', views.BookListCreateAPIView.as_view(), name='book-list-create'),
    path('books/<int:id>/', views.BookDetailAPIView.as_view(), name='book-detail'),
]
