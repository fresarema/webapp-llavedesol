from django.contrib import admin
from django.utils.html import format_html
from django.contrib.auth.models import User, Group
from django.contrib import messages
from django.urls import path
from django.http import HttpResponseRedirect
from django.utils.crypto import get_random_string
import time
from .models import Anuncio, LibroCuenta, Mensaje, EventoCalendario, Contacto, SolicitudIngreso, Donacion


@admin.register(LibroCuenta)
class LibroCuentaAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'tipo', 'fecha_periodo', 'fecha_subida', 'download_link']
    list_filter = ['tipo', 'fecha_periodo']
    search_fields = ['titulo', 'descripcion']
    
    def download_link(self, obj):
        if obj.archivo:
            return format_html('<a href="{}" download>📥 Descargar</a>', obj.archivo.url)
        return "Sin archivo"
    download_link.short_description = "Descargar Archivo"


@admin.register(Anuncio)
class AnuncioAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'creado_en']
    search_fields = ['titulo', 'descripcion']


@admin.register(Mensaje)
class MensajeAdmin(admin.ModelAdmin):
    list_display = ('asunto', 'emisor_tipo', 'destinatario_tipo', 'leido', 'creado_en')
    list_filter = ('emisor_tipo', 'destinatario_tipo', 'leido', 'creado_en')
    search_fields = ('asunto', 'mensaje')
    readonly_fields = ('creado_en',)
    
    actions = ['marcar_como_leido']
    
    def marcar_como_leido(self, request, queryset):
        queryset.update(leido=True)
    marcar_como_leido.short_description = "Marcar mensajes seleccionados como leídos"


@admin.register(EventoCalendario)
class EventoCalendarioAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'fecha', 'tipo_evento', 'lugar', 'hora_inicio', 'descripcion_corta')
    list_filter = ('tipo_evento', 'fecha')
    search_fields = ('titulo', 'descripcion', 'lugar', 'responsable')
    date_hierarchy = 'fecha'
    ordering = ('-fecha', '-hora_inicio')
    
    def descripcion_corta(self, obj):
        if obj.descripcion:
            return obj.descripcion[:50] + '...' if len(obj.descripcion) > 50 else obj.descripcion
    descripcion_corta.short_description = 'Descripción'


@admin.register(Contacto)
class ContactoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'correo', 'fecha')
    search_fields = ('nombre', 'correo', 'mensaje')
    list_filter = ('fecha',)


@admin.register(SolicitudIngreso)
class SolicitudIngresoAdmin(admin.ModelAdmin):
    list_display = ['nombre_completo', 'email', 'estado_display', 'usuario_info', 'password_info', 'fecha_solicitud', 'acciones']
    list_filter = ('estado', 'fecha_solicitud')
    search_fields = ('nombre_completo', 'rut_dni', 'email')
    readonly_fields = ('fecha_solicitud', 'usuario_creado', 'usuario_activo', 'password_generada')
    actions = ['aprobar_seleccionados', 'rechazar_seleccionados']
    
    def estado_display(self, obj):
        color = {
            'PENDIENTE': 'orange',
            'APROBADO': 'green',
            'RECHAZADO': 'red'
        }.get(obj.estado, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_estado_display()
        )
    estado_display.short_description = 'Estado'
    
    def usuario_info(self, obj):
        if obj.usuario_creado:
            user = obj.usuario_creado
            status = "✅ Activo" if user.is_active else "❌ Inactivo"
            color = "green" if user.is_active else "red"
            url = f"/admin/auth/user/{user.id}/change/"
            
            # Verificar si está en grupo SOCIO
            en_grupo_socio = user.groups.filter(name='SOCIO').exists()
            grupo_info = " 👥 SOCIO" if en_grupo_socio else " ❌ Sin grupo"
            
            return format_html(
                '<a href="{}" style="color: {};">{} {}{}</a>',
                url, color, user.username, status, grupo_info
            )
        return format_html('<span style="color: gray;">👤 No creado</span>')
    usuario_info.short_description = 'Usuario'
    
    def password_info(self, obj):
        """Muestra contraseña temporal si existe"""
        if obj.password_generada:
            return format_html(
                '<code style="background: #fff3cd; padding: 3px 6px; border-radius: 3px; font-weight: bold; color: #d32f2f;">{}</code>',
                obj.password_generada
            )
        elif obj.usuario_creado:
            return format_html(
                '<span style="color: #666; font-style: italic;">'
                '👆 Haz clic para resetear'
                '</span>'
            )
        return format_html('<span style="color: #999;">—</span>')
    password_info.short_description = 'Contraseña generada'
    
    def acciones(self, obj):
        buttons = []
        
        if obj.estado == 'PENDIENTE':
            buttons.append(
                format_html(
                    '<a href="{}" style="background: green; color: white; padding: 5px 10px; border-radius: 3px; text-decoration: none; margin-right: 5px;">✅ Aprobar</a>',
                    f"{obj.id}/aprobar/"
                )
            )
            buttons.append(
                format_html(
                    '<a href="{}" style="background: red; color: white; padding: 5px 10px; border-radius: 3px; text-decoration: none;">❌ Rechazar</a>',
                    f"{obj.id}/rechazar/"
                )
            )
        else:
            # Si ya está aprobado o rechazado, mostrar estado
            estado_text = "✅ Aprobado" if obj.estado == 'APROBADO' else "❌ Rechazado"
            return format_html(f'<span style="color: gray; font-style: italic;">{estado_text}</span>')
        
        return format_html(''.join(buttons))
    acciones.short_description = 'Acciones'
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('<path:object_id>/aprobar/', self.admin_site.admin_view(self.aprobar_solicitud), name='aprobar_solicitud'),
            path('<path:object_id>/rechazar/', self.admin_site.admin_view(self.rechazar_solicitud), name='rechazar_solicitud'),
        ]
        return custom_urls + urls
    
    def aprobar_solicitud(self, request, object_id):
        """Aprueba la solicitud y crea usuario automático ACTIVO MOSTRANDO CONTRASEÑA"""
        solicitud = SolicitudIngreso.objects.get(id=object_id)
        
        # 1. Cambiar estado
        solicitud.estado = 'APROBADO'
        
        # 2. Crear usuario automático ACTIVO si no existe
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
                    
                    solicitud.save()
                    
                    messages.success(request, f'✅ Solicitud APROBADA (usuario ya existía)')
                    messages.warning(request, f'⚠️ Usuario ya existía: {usuario_existente.username}')
                    messages.info(request, '👆 Haz clic en el usuario para resetear contraseña si es necesario')
                    
                    return HttpResponseRedirect(f'../../?t={int(time.time())}')
                
                # Generar username único
                while User.objects.filter(username=username).exists():
                    username = f"{original_username}{counter}"
                    counter += 1
                
                # Dividir nombre
                nombres = solicitud.nombre_completo.split()
                first_name = nombres[0] if nombres else ''
                last_name = ' '.join(nombres[1:]) if len(nombres) > 1 else ''
                
                # ✅ PASO CRÍTICO: Generar contraseña MANUALMENTE
                password_generada = get_random_string(12)
                
                # ✅ Guardar la contraseña en el modelo ANTES de crear usuario
                solicitud.password_generada = password_generada
                
                # ✅ Crear usuario ACTIVO con la contraseña generada
                user = User.objects.create_user(
                    username=username,
                    email=solicitud.email,
                    password=password_generada,  # Django la encripta automáticamente
                    first_name=first_name,
                    last_name=last_name,
                    is_active=True,  # ← ACTIVO
                    is_staff=False,
                    is_superuser=False
                )
                
                # Asignar al grupo SOCIO
                grupo_socio, _ = Group.objects.get_or_create(name='SOCIO')
                user.groups.add(grupo_socio)
                user.save()
                
                # Guardar referencia en la solicitud
                solicitud.usuario_creado = user
                solicitud.usuario_activo = True
                solicitud.save()  # ✅ ¡GUARDAR CON LA CONTRASEÑA!
                
                # ✅ MOSTRAR CREDENCIALES EN PANTALLA (MÁS VISIBLE)
                messages.success(request, f'✅ Solicitud de {solicitud.nombre_completo} APROBADA.')
                
                # ✅ CUADRO DESTACADO CON CREDENCIALES (IMPOSIBLE DE PASAR POR ALTO)
                messages.add_message(
                    request, 
                    messages.WARNING,  # Usar WARNING para que sea amarillo/visible
                    f'<div style="background: #fff3cd; padding: 20px; border: 3px solid #ffc107; '
                    f'border-radius: 8px; margin: 25px 0; font-family: Arial, sans-serif; '
                    f'box-shadow: 0 4px 8px rgba(0,0,0,0.1);">'
                    f'<h3 style="color: #856404; margin-top: 0; border-bottom: 2px solid #ffc107; padding-bottom: 10px;">'
                    f'📧 <u>CREDENCIALES PARA EL SOCIO</u>'
                    f'</h3>'
                    f'<div style="background: white; padding: 20px; border-radius: 5px; '
                    f'border: 2px dashed #4CAF50; margin: 15px 0;">'
                    f'<p style="margin: 10px 0; font-size: 15px;"><strong>👤 Nombre:</strong> {solicitud.nombre_completo}</p>'
                    f'<p style="margin: 10px 0; font-size: 15px;"><strong>📧 Email:</strong> {solicitud.email}</p>'
                    f'<p style="margin: 10px 0; font-size: 15px;"><strong>🔑 Usuario:</strong> '
                    f'<span style="background: #f5f5f5; padding: 6px 12px; border-radius: 4px; '
                    f'font-family: monospace; font-size: 16px; border: 1px solid #ddd;">{user.username}</span></p>'
                    f'<p style="margin: 10px 0; font-size: 15px;"><strong>🔒 Contraseña:</strong> '
                    f'<span style="background: #ffeb3b; padding: 8px 16px; border-radius: 4px; '
                    f'font-family: monospace; font-size: 18px; font-weight: bold; color: #d32f2f; '
                    f'border: 2px solid #ff9800; display: inline-block; margin-top: 5px;">{password_generada}</span></p>'
                    f'</div>'
                    f'<div style="background: #f8f9fa; padding: 12px; border-radius: 4px; margin-top: 15px;">'
                    f'<p style="color: #856404; font-size: 14px; margin: 0;">'
                    f'<strong>⚠️ IMPORTANTE:</strong> Copia estas credenciales y envíalas al socio por email o WhatsApp.'
                    f'</p>'
                    f'<p style="color: #856404; font-size: 13px; margin: 5px 0 0 0;">'
                    f'La contraseña también quedó guardada en esta solicitud para referencia futura.'
                    f'</p>'
                    f'</div>'
                    f'</div>',
                    extra_tags='safe'
                )
                
                # Mensaje adicional
                messages.info(request, '💡 Las credenciales también aparecen en la columna "Contraseña generada" de la lista.')
                
            except Exception as e:
                messages.error(request, f'❌ Error creando usuario: {str(e)}')
                import traceback
                traceback.print_exc()
        else:
            # Si ya existe usuario
            usuario = solicitud.usuario_creado
            if not usuario.is_active:
                usuario.is_active = True
                usuario.save()
                solicitud.usuario_activo = True
                messages.info(request, f'✅ Usuario existente activado: {usuario.username}')
            else:
                messages.info(request, f'ℹ️ Usuario ya existía y estaba activo: {usuario.username}')
            
            # Verificar grupo
            en_grupo_socio = usuario.groups.filter(name='SOCIO').exists()
            if not en_grupo_socio:
                grupo_socio, _ = Group.objects.get_or_create(name='SOCIO')
                usuario.groups.add(grupo_socio)
                messages.info(request, f'✅ Usuario agregado al grupo SOCIO')
            else:
                messages.info(request, f'✅ Usuario ya estaba en grupo SOCIO')
            
            messages.info(request, '👆 Para ver/restablecer contraseña, haz clic en el nombre de usuario arriba')
        
        solicitud.save()
        
        # Redirigir con timestamp para evitar cache
        return HttpResponseRedirect(f'../../?t={int(time.time())}')
    
    def rechazar_solicitud(self, request, object_id):
        solicitud = SolicitudIngreso.objects.get(id=object_id)
        solicitud.estado = 'RECHAZADO'
        solicitud.save()
        
        messages.success(request, f'❌ Solicitud de {solicitud.nombre_completo} RECHAZADA.')
        return HttpResponseRedirect(f'../../?t={int(time.time())}')
    
    def aprobar_seleccionados(self, request, queryset):
        """Acción masiva para aprobar solicitudes seleccionadas"""
        for solicitud in queryset.filter(estado='PENDIENTE'):
            solicitud.estado = 'APROBADO'
            if not solicitud.usuario_creado:
                try:
                    # Usar el método del modelo
                    usuario = solicitud.crear_usuario_inactivo()
                    if usuario:
                        print(f"✅ Usuario creado para {solicitud.nombre_completo}")
                except Exception as e:
                    print(f"❌ Error creando usuario para {solicitud.nombre_completo}: {e}")
            solicitud.save()
        
        count = queryset.count()
        messages.success(request, f'✅ {count} solicitudes aprobadas.')
        messages.warning(request, '⚠️ Revisa cada solicitud para ver las credenciales generadas.')
    aprobar_seleccionados.short_description = "Aprobar solicitudes seleccionadas"
    
    def rechazar_seleccionados(self, request, queryset):
        """Acción masiva para rechazar solicitudes seleccionadas"""
        queryset.update(estado='RECHAZADO')
        count = queryset.count()
        messages.success(request, f'❌ {count} solicitudes rechazadas.')
    rechazar_seleccionados.short_description = "Rechazar solicitudes seleccionadas"


@admin.register(Donacion)
class DonacionAdmin(admin.ModelAdmin):
    list_display = ('nombre_donador', 'monto', 'estado', 'fecha_donacion')
    list_filter = ('estado', 'fecha_donacion')
    search_fields = ('nombre_donador', 'preference_id', 'pago_id')