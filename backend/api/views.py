from django.shortcuts import render
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Anuncio, LibroCuenta, Mensaje  
from .serializers import AnuncioSerializer, LibroCuentaSerializer, MensajeSerializer 

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

# ✅ VIEWSET CORREGIDO PARA MENSAJES
class MensajeViewSet(viewsets.ModelViewSet):
    serializer_class = MensajeSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        # Obtener parámetro de filtro de la URL
        emisor_tipo = self.request.query_params.get('emisor_tipo', None)
        
        queryset = Mensaje.objects.all().order_by('-creado_en')
        
        # Filtrar por emisor_tipo si se proporciona
        if emisor_tipo:
            queryset = queryset.filter(emisor_tipo=emisor_tipo)
            
        return queryset