from django.urls import path, include
from rest_framework.routers import DefaultRouter


from .views import (
    MyTokenObtainPairView,
    AnuncioViewSet, 
    LibroCuentaViewSet, 
    MensajeViewSet,
    ContactoViewSet,
    crear_preferencia, 
    webhook_mp,
    CrearSolicitudView,
    ListarSolicitudesView,
    ActualizarSolicitudView
)

router = DefaultRouter()
router.register(r'anuncios', AnuncioViewSet, basename='anuncios')
router.register(r'libros-cuentas', LibroCuentaViewSet, basename='librocuenta')
router.register(r'mensajes', MensajeViewSet, basename='mensajes')
router.register(r'contacto', ContactoViewSet)

urlpatterns = [

    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    

    path('', include(router.urls)),
    path('solicitud-ingreso/', CrearSolicitudView.as_view(), name='crear_solicitud'),
    path('admin/solicitudes/', ListarSolicitudesView.as_view(), name='listar_solicitudes'),
    path('admin/solicitudes/<int:pk>/', ActualizarSolicitudView.as_view(), name='actualizar_solicitud'),
    
    # --------------------------------------------------------
    # RUTAS PARA MERCADO PAGO
    # --------------------------------------------------------
    
    path('crear-preferencia/', crear_preferencia, name='crear_preferencia'),
    
    # Endpoint de Webhook
    path('webhook-mercadopago/', webhook_mp, name='webhook_mp'),
]