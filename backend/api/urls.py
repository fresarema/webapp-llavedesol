from django.urls import path, include
from rest_framework.routers import DefaultRouter


from .views import (
    MyTokenObtainPairView,
    AnuncioViewSet, 
    LibroCuentaViewSet, 
    MensajeViewSet,
    crear_preferencia, 
    webhook_mp 
)

router = DefaultRouter()
router.register(r'anuncios', AnuncioViewSet, basename='anuncios')
router.register(r'libros-cuentas', LibroCuentaViewSet, basename='librocuenta')
router.register(r'mensajes', MensajeViewSet, basename='mensajes')

urlpatterns = [

    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    

    path('', include(router.urls)),
    
    # --------------------------------------------------------
    # RUTAS PARA MERCADO PAGO
    # --------------------------------------------------------
    
    path('crear-preferencia/', crear_preferencia, name='crear_preferencia'),
    
    # Endpoint de Webhook
    path('webhook-mercadopago/', webhook_mp, name='webhook_mp'),
]