from django.urls import path, include
from .views import MyTokenObtainPairView
from rest_framework.routers import DefaultRouter
from .views import AnuncioViewSet

router = DefaultRouter()
router.register(r'anuncios', AnuncioViewSet, basename='anuncios')

urlpatterns = [
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('', include(router.urls)),
]
