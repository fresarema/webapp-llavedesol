from django.urls import path, include
from .views import MyTokenObtainPairView
from rest_framework.routers import DefaultRouter
from .views import AnuncioViewSet, LibroCuentaViewSet, MensajeViewSet

router = DefaultRouter()
router.register(r'anuncios', AnuncioViewSet, basename='anuncios')
router.register(r'libros-cuentas', LibroCuentaViewSet, basename='librocuenta')
router.register(r'mensajes', MensajeViewSet, basename='mensajes')  # ✅ Correcto

urlpatterns = [
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('', include(router.urls)),
]