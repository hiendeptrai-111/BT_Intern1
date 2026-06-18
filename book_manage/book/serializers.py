from rest_framework import serializers
from .models import Book


class BookSerializer(serializers.ModelSerializer):
    """Serializer dùng chung cho cả List, Detail, Create, Update."""
    class Meta:
        model = Book
        fields = '__all__'
