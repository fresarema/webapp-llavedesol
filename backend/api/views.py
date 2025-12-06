from django.shortcuts import render
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer
from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action, api_view 
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from django.db.models import Q
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt 
from django.utils import timezone 
import json
import decimal
import traceback
import django.db.utils
from django.db import transaction

# --- Dependencias ---
from .models import Anuncio, LibroCuenta, Mensaje, Contacto, Donacion, SolicitudIngreso
from .serializers import AnuncioSerializer, LibroCuentaSerializer, MensajeSerializer, ContactoSerializer, DonacionSerializer , SolicitudIngresoSerializer

# --- SDK de Mercado Pago (Python) ---
import mercadopago

# Access Token de Prueba. 
CLIENT_ACCESS_TOKEN = "APP_USR-2742675530756841-112514-9eb713561d3b37de493dfa7e3d5514d5-3013801739"
# Inicialización del cliente de Mercado Pago
client = mercadopago.SDK(CLIENT_ACCESS_TOKEN)


# -----------------------------------------------------------------------------------
# VISTAS ESTÁNDARES
# -----------------------------------------------------------------------------------

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    
class IsTesoreroOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.groups.filter(name='Tesorero').exists() or request.user.is_staff)
        )

class AnuncioViewSet(viewsets.ModelViewSet):
    queryset = Anuncio.objects.all()
    serializer_class = AnuncioSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class LibroCuentaViewSet(viewsets.ModelViewSet):
    queryset = LibroCuenta.objects.all()
    serializer_class = LibroCuentaSerializer
    permission_classes = [IsTesoreroOrAdmin]

class ContactoViewSet(viewsets.ModelViewSet):
    queryset = Contacto.objects.all().order_by('-fecha')
    serializer_class = ContactoSerializer

class CrearSolicitudView(generics.CreateAPIView):
    queryset = SolicitudIngreso.objects.all()
    serializer_class = SolicitudIngresoSerializer
    permission_classes = [AllowAny] 

class ListarSolicitudesView(generics.ListAPIView):
    queryset = SolicitudIngreso.objects.all().order_by('-fecha_solicitud')
    serializer_class = SolicitudIngresoSerializer
    permission_classes = [IsAdminUser] 

class ActualizarSolicitudView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SolicitudIngreso.objects.all()
    serializer_class = SolicitudIngresoSerializer
    permission_classes = [IsAdminUser]

class MensajeViewSet(viewsets.ModelViewSet):
    serializer_class = MensajeSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        emisor_tipo = self.request.query_params.get('emisor_tipo', None)
        queryset = Mensaje.objects.all().order_by('-creado_en')
        
        if emisor_tipo:
            queryset = queryset.filter(emisor_tipo=emisor_tipo)
            
        return queryset


# -----------------------------------------------------------------------------------
# VISTAS DE MERCADO PAGO (Flujo de Pago y Webhook)
# -----------------------------------------------------------------------------------

# Ruta para crear la preferencia (Llamada React)
@api_view(['POST'])
@csrf_exempt 
@transaction.atomic
def crear_preferencia(request):
    
    # URL de tu túnel Ngrok 
    NGROK_BASE_URL = "https://perceivable-exemptive-kasha.ngrok-free.dev"
    FRONTEND_URL = "http://localhost:5173" 

    try:
        data = request.data
        item_data = data.get('item', data) 
        
        try:
            quantity = int(item_data.get('quantity', 1))
            unit_price = decimal.Decimal(item_data.get('unit_price', 0)) 
            monto_total = unit_price * quantity
            donor_name = item_data.get('donor_name', 'Donador Anónimo')
        except (ValueError, TypeError) as e:
            raise ValueError(f"Datos numéricos inválidos: {e}")

        pedido = Donacion.objects.create( 
            nombre_donador=donor_name, 
            monto=monto_total,
            estado='pendiente',
        )

        
        # CREAR EL CUERPO DE LA PREFERENCIA PARA MERCADO PAGO
        mp_body = {
            "items": [{
                "title": item_data.get('title', "Donación"),
                "quantity": quantity,
                "unit_price": float(unit_price),
                "currency_id": "CLP" 
            }],

            "external_reference": str(pedido.pk), 
            
            "back_urls": {
                "success": "https://www.google.com/success", 
                "failure": "https://www.google.com/failure",
                "pending": "https://www.google.com/pending",
            },
            "auto_return": "approved",
            
            "notification_url": f"{NGROK_BASE_URL}/api/webhook-mercadopago/", 
        }

        # LLAMA A LA API DE MERCADO PAGO
        try:
            preference_result = client.preference().create(mp_body)
            
            if 'response' not in preference_result or preference_result['response'].get('id') is None:
                raise Exception(f"MP API no devolvió preference ID. Respuesta: {preference_result}")
                
            preference_id = preference_result['response'].get("id")
            pedido.preference_id = preference_id
            pedido.save() 
            
            return Response({'id': preference_id}, status=status.HTTP_201_CREATED)

        except Exception as mp_e:
            error_message = f'Error en la comunicación con Mercado Pago: {str(mp_e)}. Fallo al generar la preferencia.'
            traceback.print_exc()

            return Response({'error': error_message}, 
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        traceback.print_exc()
        error_message = f'Error interno inesperado: {str(e)}'

        return Response({'error': error_message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#
@api_view(['POST']) 
@csrf_exempt 
@transaction.atomic
def webhook_mp(request):
    
    if request.method == 'POST':

        topic = request.GET.get('topic') or request.GET.get('type')
        resource_id = request.GET.get('id') or request.GET.get('data.id')
        
        internal_order_id = None
        
        try:

            if topic == 'payment' and resource_id:
                payment_info = client.payment().get(resource_id)
                
                mp_status = payment_info['response']['status']
                internal_order_id = payment_info['response']['external_reference']

                if internal_order_id:
                    try:
                        pedido = Donacion.objects.select_for_update().get(pk=internal_order_id) 
                        
                        if mp_status == 'approved' and pedido.estado == 'pendiente':   
                            fecha_actual = timezone.now()                          
                            pedido.fecha_donacion = fecha_actual
                            pedido.estado = 'validado'
                            pedido.pago_id = resource_id
                            pedido.save() 
                            
                        elif mp_status == 'rejected' and pedido.estado == 'pendiente':
                            pedido.estado = 'rechazado'
                            pedido.pago_id = resource_id
                            pedido.save()
                    
                    except django.db.utils.OperationalError:
                        pass
                    except Donacion.DoesNotExist:
                        pass

        except Exception as e:
            import traceback 
            traceback.print_exc()
            
        return HttpResponse(status=200) 
    
    return HttpResponse(status=405) # Método no permitido