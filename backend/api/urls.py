from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProfileViewSet, ApplicationViewSet, DocumentViewSet, 
    AuditLogViewSet, RegisterView, UserDetailView, UserDocumentViewSet,
    PolicySettingViewSet, FundingCalculationView, ComplianceValidationView,
    FormBTrackingViewSet, PaymentScheduleViewSet, DecisionLetterView, BudgetStatusView
)

router = DefaultRouter()
router.register(r'profiles', ProfileViewSet)
router.register(r'applications', ApplicationViewSet)
router.register(r'documents', DocumentViewSet)
router.register(r'audit-logs', AuditLogViewSet)
router.register(r'user-documents', UserDocumentViewSet)
router.register(r'register', RegisterView, basename='register')
router.register(r'users', UserDetailView, basename='users')
router.register(r'policy-settings', PolicySettingViewSet, basename='policy-setting')
router.register(r'funding-calculation', FundingCalculationView, basename='funding-calculation')
router.register(r'compliance-validation', ComplianceValidationView, basename='compliance-validation')
router.register(r'form-b-tracking', FormBTrackingViewSet, basename='form-b-tracking')
router.register(r'payment-schedule', PaymentScheduleViewSet, basename='payment-schedule')
router.register(r'decision-letter', DecisionLetterView, basename='decision-letter')
router.register(r'budget-status', BudgetStatusView, basename='budget-status')

urlpatterns = [
    path('', include(router.urls)),
]
