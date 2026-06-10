import django_filters
from .models import Book


class BookFilter(django_filters.FilterSet):
    """Custom filter for Book model with multiple field filters."""
    
    # Title filter - contains search
    title = django_filters.CharFilter(
        field_name='title',
        lookup_expr='icontains',
        label='Search by title'
    )
    
    # Author filter - contains search
    author = django_filters.CharFilter(
        field_name='author',
        lookup_expr='icontains',
        label='Search by author'
    )
    
    # Price range filters
    price_min = django_filters.NumberFilter(
        field_name='price',
        lookup_expr='gte',
        label='Min price'
    )
    price_max = django_filters.NumberFilter(
        field_name='price',
        lookup_expr='lte',
        label='Max price'
    )
    
    # Quantity range filters
    quantity_min = django_filters.NumberFilter(
        field_name='quantity',
        lookup_expr='gte',
        label='Min quantity'
    )
    quantity_max = django_filters.NumberFilter(
        field_name='quantity',
        lookup_expr='lte',
        label='Max quantity'
    )
    
    class Meta:
        model = Book
        fields = []  # We define custom filters above
