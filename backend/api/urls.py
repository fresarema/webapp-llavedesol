from django.urls import path, include
from .views import MyTokenObtainPairView
from rest_framework.routers import DefaultRouter
from .views import AnuncioViewSet, LibroCuentaViewSet  # Importar la nueva vista

# PRIMERO crear el router
router = DefaultRouter()

# LUEGO registrar las vistas
router.register(r'anuncios', AnuncioViewSet, basename='anuncios')
router.register(r'libros-cuentas', LibroCuentaViewSet, basename='librocuenta')

urlpatterns = [
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('', include(router.urls)),
]