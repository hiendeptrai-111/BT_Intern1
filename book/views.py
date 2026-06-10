from django.template import loader
from django.shortcuts import render
from django.http import HttpResponse
from .models import Book
from .serializers import BookSerializer, BookDetailSerializer
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .pagination import BookPagination
from .filters import BookFilter

class BookListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Book.objects.all()
    pagination_class = BookPagination
    serializer_class = BookSerializer
    filterset_class = BookFilter
    
    def get_queryset(self):
        """Return all books - filters applied by BookFilter via filterset_class."""
        return Book.objects.all()

class BookDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Book.objects.all()
    serializer_class = BookDetailSerializer
    lookup_field = 'id'

# def main(request):
#     return render(request, 'main.html')


# def template(request):
#     template =loader.get_template('main.html')
#     mymembers = Book.objects.all()
#     return HttpResponse(template.render({'mymembers': mymembers}, request))

# def book(request):
#     queryset = Book.objects.all()
#     return render(request, 'all_book.html', {'mymembers': queryset})

# def details(request, id):
#     mymember = Book.objects.get(id=id)
#     template = loader.get_template('details.html')
#     context = {
#         'all_books': mymember,
#     }
#     return HttpResponse(template.render(context, request)) 

