from django.contrib import admin
from django.utils.html import format_html
from .models import Anuncio, LibroCuenta,Mensaje

@admin.register(LibroCuenta)
class LibroCuentaAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'tipo', 'fecha_periodo', 'fecha_subida', 'download_link']
    list_filter = ['tipo', 'fecha_periodo']
    search_fields = ['titulo', 'descripcion']
    
    # Columna personalizada para descargar
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
    
    # Acción personalizada para marcar como leído
    actions = ['marcar_como_leido']
    
    def marcar_como_leido(self, request, queryset):
        queryset.update(leido=True)
    marcar_como_leido.short_description = "Marcar mensajes seleccionados como leídos"