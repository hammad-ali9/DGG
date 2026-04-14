from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProfileViewSet, ApplicationViewSet, DocumentViewSet, 
    AuditLogViewSet, RegisterView, UserDetailView, UserDocumentViewSet
)

router = DefaultRouter()
router.register(r'profiles', ProfileViewSet)
router.register(r'applications', ApplicationViewSet)
router.register(r'documents', DocumentViewSet)
router.register(r'audit-logs', AuditLogViewSet)
router.register(r'user-documents', UserDocumentViewSet)
router.register(r'register', RegisterView, basename='register')
router.register(r'users', UserDetailView, basename='users')

urlpatterns = [
    path('', include(router.urls)),
]
