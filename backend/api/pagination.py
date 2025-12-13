from rest_framework.pagination import PageNumberPagination

class DonacionPageNumberPagination(PageNumberPagination):
    # Esto mapea el parámetro 'limit' del frontend al tamaño de página de DRF
    page_size_query_param = 'limit' 
    page_size = 10 
    max_page_size = 100