from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Anuncio,LibroCuenta
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