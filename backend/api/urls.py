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
    ActualizarSolicitudView,
    EventoCalendarioViewSet,
    aprobar_solicitud_con_usuario,
    cambiar_password  # <-- IMPORTAR LA NUEVA VISTA
)

router = DefaultRouter()
router.register(r'anuncios', AnuncioViewSet, basename='anuncios')
router.register(r'libros-cuentas', LibroCuentaViewSet, basename='librocuenta')
router.register(r'mensajes', MensajeViewSet, basename='mensajes')
router.register(r'contacto', ContactoViewSet)
router.register(r'eventos-calendario', EventoCalendarioViewSet)

urlpatterns = [
    # Autenticación
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    # Rutas del router
    path('', include(router.urls)),
    
    # Solicitudes de ingreso
    path('solicitud-ingreso/', CrearSolicitudView.as_view(), name='crear_solicitud'),
    path('admin/solicitudes/', ListarSolicitudesView.as_view(), name='listar_solicitudes'),
    path('admin/solicitudes/<int:pk>/', ActualizarSolicitudView.as_view(), name='actualizar_solicitud'),
    
    # Aprobar y crear usuario automático
    path('admin/solicitudes/<int:solicitud_id>/aprobar-con-usuario/', 
         aprobar_solicitud_con_usuario, 
         name='aprobar_solicitud_con_usuario'),
    
    # NUEVA RUTA: Cambiar contraseña
    path('cambiar-password/', cambiar_password, name='cambiar_password'),
    
    # --------------------------------------------------------
    # RUTAS PARA MERCADO PAGO
    # --------------------------------------------------------
    path('crear-preferencia/', crear_preferencia, name='crear_preferencia'),
    path('webhook-mercadopago/', webhook_mp, name='webhook_mp'),
]