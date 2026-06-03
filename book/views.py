from django.template import loader
from django.shortcuts import render
from django.http import HttpResponse
from .models import Book
from .serializers import BookSerializer, BookDetailSerializer
from rest_framework import generics

class BookListCreateAPIView(generics.ListCreateAPIView):
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


def testing(request):
    template = loader.get_template('template.html')
    context = {
        'fruits': ['Apple', 'Banana', 'Cherry'],   
    }
    return HttpResponse(template.render(context, request))

