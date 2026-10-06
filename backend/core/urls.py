from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AuthNonceView,
    AuthVerifyView,
    UserProfileView,
    AgreementMetadataViewSet,
    DeliverableSubmissionViewSet,
    DisputeCaseViewSet,
    TransactionEventViewSet,
    NotificationViewSet,
)

router = DefaultRouter()
router.register(r'agreements', AgreementMetadataViewSet, basename='agreement-metadata')
router.register(r'submissions', DeliverableSubmissionViewSet, basename='deliverable-submission')
router.register(r'disputes', DisputeCaseViewSet, basename='dispute-case')
router.register(r'events', TransactionEventViewSet, basename='transaction-event')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('auth/nonce/', AuthNonceView.as_view(), name='auth-nonce'),
    path('auth/verify/', AuthVerifyView.as_view(), name='auth-verify'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('', include(router.urls)),
]
