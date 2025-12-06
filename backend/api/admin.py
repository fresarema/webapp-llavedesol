from django.contrib import admin
from django.utils.html import format_html
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

# ¡CORREGIDO! Usando los campos REALES de tu modelo
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
        return "-"
    descripcion_corta.short_description = 'Descripción'

# También puedes registrar los otros modelos que faltan:
@admin.register(Contacto)
class ContactoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'correo', 'fecha')
    search_fields = ('nombre', 'correo', 'mensaje')
    list_filter = ('fecha',)

@admin.register(SolicitudIngreso)
class SolicitudIngresoAdmin(admin.ModelAdmin):
    list_display = ('nombre_completo', 'rut_dni', 'email', 'estado', 'fecha_solicitud')
    list_filter = ('estado', 'fecha_solicitud')
    search_fields = ('nombre_completo', 'rut_dni', 'email')
    readonly_fields = ('fecha_solicitud',)

@admin.register(Donacion)
class DonacionAdmin(admin.ModelAdmin):
    list_display = ('nombre_donador', 'monto', 'estado', 'fecha_donacion')
    list_filter = ('estado', 'fecha_donacion')
    search_fields = ('nombre_donador', 'preference_id', 'pago_id')