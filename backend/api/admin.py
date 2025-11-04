from django.contrib import admin
from django.utils.html import format_html
from .models import Anuncio, LibroCuenta

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
    
    # Permisos para tesoreros
    def has_add_permission(self, request):
        return request.user.groups.filter(name='Tesorero').exists() or request.user.is_superuser
    
    def has_change_permission(self, request, obj=None):
        return request.user.groups.filter(name='Tesorero').exists() or request.user.is_superuser
    
    def has_delete_permission(self, request, obj=None):
        return request.user.groups.filter(name='Tesorero').exists() or request.user.is_superuser
    
    def has_view_permission(self, request, obj=None):
        return request.user.groups.filter(name='Tesorero').exists() or request.user.is_superuser

@admin.register(Anuncio)
class AnuncioAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'creado_en']
    search_fields = ['titulo', 'descripcion']