from django.shortcuts import render
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer
from rest_framework import viewsets, permissions
from .models import Anuncio, LibroCuenta
from .serializers import AnuncioSerializer, LibroCuentaSerializer

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    
class AnuncioViewSet(viewsets.ModelViewSet):
    queryset = Anuncio.objects.all()
    serializer_class = AnuncioSerializer

class IsTesoreroOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.groups.filter(name='Tesorero').exists() or request.user.is_staff)
        )

class LibroCuentaViewSet(viewsets.ModelViewSet):
    queryset = LibroCuenta.objects.all()
    serializer_class = LibroCuentaSerializer
    permission_classes = [IsTesoreroOrAdmin]

    def get_queryset(self):
        return super().get_queryset()