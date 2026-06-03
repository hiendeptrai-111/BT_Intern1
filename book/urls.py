from django.urls import path
from . import views
urlpatterns = [
    path('', views.main, name='main'),
    path('books/', views.BookListCreateAPIView.as_view(), name='book'),
    path('books/<int:id>/', views.BookDetailAPIView.as_view(), name='details'),
    path('testing/', views.testing, name='testing'),
]
