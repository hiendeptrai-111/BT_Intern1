from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from . import views
urlpatterns = [
    # path('', views.main, name='main'),
    path('books/', views.BookListCreateAPIView.as_view(), name='book'),
    path('books/<int:id>/', views.BookDetailAPIView.as_view(), name='api-details'),
    # path('template/', views.template, name='template'),
    # path('all_book/', views.book, name='all_book'),
    # path('all_book/details/<int:id>/', views.details, name='all_book_details'),
    # path('details/<int:id>/', views.details, name='page-details'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
