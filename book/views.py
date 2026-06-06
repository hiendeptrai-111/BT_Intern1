from django.template import loader
from django.shortcuts import render
from django.http import HttpResponse
from .models import Book
from .serializers import BookSerializer, BookDetailSerializer
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

class BookListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    def get_queryset(self):
        queryset = Book.objects.all()
        title = self.request.query_params.get('title', None)
        if title is not None:
            queryset = queryset.filter(title__icontains=title)
        return queryset

class BookDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Book.objects.all()
    serializer_class = BookDetailSerializer
    lookup_field = 'id'

def main(request):
    return render(request, 'main.html')


def template(request):
    template =loader.get_template('main.html')
    mymembers = Book.objects.all()
    return HttpResponse(template.render({'mymembers': mymembers}, request))

def book(request):
    queryset = Book.objects.all()
    return render(request, 'all_book.html', {'mymembers': queryset})

def details(request, id):
    mymember = Book.objects.get(id=id)
    template = loader.get_template('details.html')
    context = {
        'all_books': mymember,
    }
    return HttpResponse(template.render(context, request)) 

