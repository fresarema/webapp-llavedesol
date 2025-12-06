from django.shortcuts import render
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer
from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from django.db.models import Q
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt 
from django.utils import timezone 
from django.utils.crypto import get_random_string
import json
import decimal
import traceback
import django.db.utils
from django.db import transaction
from django.contrib.auth.models import User, Group
from django.contrib.auth import update_session_auth_hash

# --- Dependencias ---
from .models import Anuncio, LibroCuenta, Mensaje, Contacto, Donacion, SolicitudIngreso, EventoCalendario
from .serializers import AnuncioSerializer, LibroCuentaSerializer, MensajeSerializer, ContactoSerializer, DonacionSerializer, SolicitudIngresoSerializer, EventoCalendarioSerializer

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
    
    def post(self, request, *args, **kwargs):
        # Verificar si el usuario existe y está inactivo
        username = request.data.get('username')
        if username:
            try:
                user = User.objects.get(username=username)
                if not user.is_active:
                    return Response({
                        'detail': 'Usuario inactivo. Contacta al administrador para activar tu cuenta.'
                    }, status=status.HTTP_403_FORBIDDEN)
            except User.DoesNotExist:
                pass  # Continuar con el flujo normal de JWT
        
        return super().post(request, *args, **kwargs)
    
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

class EventoCalendarioViewSet(viewsets.ModelViewSet):
    queryset = EventoCalendario.objects.all()
    serializer_class = EventoCalendarioSerializer
    permission_classes = [permissions.IsAuthenticated]


# -----------------------------------------------------------------------------------
# VISTA ESPECIAL PARA APROBAR Y CREAR USUARIO AUTOMÁTICO (PARA REACT)
# -----------------------------------------------------------------------------------

@api_view(['POST'])
@permission_classes([IsAdminUser])
def aprobar_solicitud_con_usuario(request, solicitud_id):
    """
    Vista especial para React que:
    1. Aprueba la solicitud
    2. Crea usuario automático ACTIVO
    3. Asigna al grupo SOCIO
    """
    try:
        solicitud = SolicitudIngreso.objects.get(id=solicitud_id)
        
        # Verificar que no esté ya aprobada
        if solicitud.estado == 'APROBADO':
            return Response({
                'success': True,
                'message': 'La solicitud ya estaba aprobada',
                'estado': 'APROBADO'
            })
        
        # 1. Cambiar estado a APROBADO
        solicitud.estado = 'APROBADO'
        
        # 2. Crear usuario si no existe
        usuario_creado = None
        password_generada = None
        
        if not solicitud.usuario_creado:
            try:
                # Crear username del RUT
                username = solicitud.rut_dni.lower().replace('.', '').replace('-', '')
                counter = 1
                original_username = username
                
                # Verificar si ya existe usuario con ese email
                if User.objects.filter(email=solicitud.email).exists():
                    usuario_existente = User.objects.get(email=solicitud.email)
                    solicitud.usuario_creado = usuario_existente
                    usuario_creado = usuario_existente
                    
                    # ACTIVAR usuario si está inactivo
                    if not usuario_existente.is_active:
                        usuario_existente.is_active = True
                        usuario_existente.save()
                        solicitud.usuario_activo = True
                    
                    # Verificar si está en grupo SOCIO
                    en_grupo_socio = usuario_existente.groups.filter(name='SOCIO').exists()
                    if not en_grupo_socio:
                        grupo_socio, _ = Group.objects.get_or_create(name='SOCIO')
                        usuario_existente.groups.add(grupo_socio)
                        usuario_existente.save()
                    
                    solicitud.save()
                    
                    return Response({
                        'success': True,
                        'message': f'Usuario ya existía: {usuario_existente.username} - Activado y asignado a grupo SOCIO',
                        'estado': 'APROBADO',
                        'usuario': usuario_existente.username,
                        'grupo_socio': True,
                        'usuario_activo': True
                    })
                
                # Generar username único
                while User.objects.filter(username=username).exists():
                    username = f"{original_username}{counter}"
                    counter += 1
                
                # Dividir nombre
                nombres = solicitud.nombre_completo.split()
                first_name = nombres[0] if nombres else ''
                last_name = ' '.join(nombres[1:]) if len(nombres) > 1 else ''
                
                # ✅ Crear usuario ACTIVO con contraseña aleatoria
                password_generada = get_random_string(12)
                user = User.objects.create_user(
                    username=username,
                    email=solicitud.email,
                    password=password_generada,
                    first_name=first_name,
                    last_name=last_name,
                    is_active=True,  # ✅ USUARIO ACTIVO AUTOMÁTICAMENTE
                    is_staff=False,
                    is_superuser=False
                )
                
                # Asignar al grupo SOCIO
                grupo_socio, _ = Group.objects.get_or_create(name='SOCIO')
                user.groups.add(grupo_socio)
                user.save()  # Guardar explícitamente
                
                # Guardar referencia en la solicitud
                solicitud.usuario_creado = user
                solicitud.usuario_activo = True  # ✅ Marcar como activo
                usuario_creado = user
                
                # Verificar asignación
                en_grupo_socio = user.groups.filter(name='SOCIO').exists()
                print(f"DEBUG: Usuario {username} en grupo SOCIO: {en_grupo_socio}")
                
            except Exception as e:
                return Response({
                    'success': False,
                    'message': f'Solicitud aprobada pero error creando usuario: {str(e)}',
                    'estado': 'APROBADO'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            # Si ya tenía usuario, verificar si está activo
            usuario_creado = solicitud.usuario_creado
            en_grupo_socio = usuario_creado.groups.filter(name='SOCIO').exists()
            
            # ✅ ACTIVAR si está inactivo
            if not usuario_creado.is_active:
                usuario_creado.is_active = True
                solicitud.usuario_activo = True
            
            if not en_grupo_socio:
                grupo_socio, _ = Group.objects.get_or_create(name='SOCIO')
                usuario_creado.groups.add(grupo_socio)
            
            usuario_creado.save()
        
        # Guardar la solicitud
        solicitud.save()
        
        # Preparar respuesta
        response_data = {
            'success': True,
            'message': f'Solicitud de {solicitud.nombre_completo} aprobada correctamente',
            'estado': 'APROBADO',
            'usuario': usuario_creado.username if usuario_creado else None,
            'grupo_socio': True,
            'usuario_activo': usuario_creado.is_active if usuario_creado else False,
        }
        
        if password_generada:
            response_data['password'] = password_generada
            response_data['nota'] = '✅ Usuario ACTIVO - Listo para iniciar sesión.'
        
        return Response(response_data)
        
    except SolicitudIngreso.DoesNotExist:
        return Response({
            'error': 'Solicitud no encontrada'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Error interno: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# -----------------------------------------------------------------------------------
# VISTA PARA CAMBIAR CONTRASEÑA (PARA SOCIOS)
# -----------------------------------------------------------------------------------

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cambiar_password(request):
    """
    Permite al usuario cambiar su propia contraseña
    """
    try:
        user = request.user
        
        # Obtener datos del request
        password_actual = request.data.get('password_actual')
        nueva_password = request.data.get('nueva_password')
        confirmar_password = request.data.get('confirmar_password')
        
        # Validaciones
        if not password_actual or not nueva_password or not confirmar_password:
            return Response({
                'success': False,
                'message': 'Todos los campos son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if nueva_password != confirmar_password:
            return Response({
                'success': False,
                'message': 'Las contraseñas nuevas no coinciden'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(nueva_password) < 8:
            return Response({
                'success': False,
                'message': 'La nueva contraseña debe tener al menos 8 caracteres'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar contraseña actual
        if not user.check_password(password_actual):
            return Response({
                'success': False,
                'message': 'La contraseña actual es incorrecta'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar que no sea la misma contraseña
        if user.check_password(nueva_password):
            return Response({
                'success': False,
                'message': 'La nueva contraseña no puede ser igual a la actual'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Cambiar contraseña
        user.set_password(nueva_password)
        user.save()
        
        # Mantener la sesión activa después de cambiar la contraseña
        update_session_auth_hash(request, user)
        
        return Response({
            'success': True,
            'message': '✅ Contraseña cambiada exitosamente'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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