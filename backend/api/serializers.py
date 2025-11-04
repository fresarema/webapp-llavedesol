from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Anuncio, LibroCuenta, Mensaje
from rest_framework import serializers

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['is_admin'] = user.is_staff 
        token['is_tesorero'] = user.groups.filter(name='Tesorero').exists()
        return token

class AnuncioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Anuncio
        fields = '__all__'

class LibroCuentaSerializer(serializers.ModelSerializer):
    class Meta:
        model = LibroCuenta
        fields = '__all__'

class MensajeSerializer(serializers.ModelSerializer):
    # Campos de solo lectura para mostrar información adicional
    emisor_display = serializers.SerializerMethodField()
    destinatario_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Mensaje
        fields = '__all__'
    
    def get_emisor_display(self, obj):
        return obj.get_emisor_tipo_display()
    
    def get_destinatario_display(self, obj):
        return obj.get_destinatario_tipo_display()