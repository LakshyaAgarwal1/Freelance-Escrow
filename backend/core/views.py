from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from .models import (
    WalletAccount,
    UserProfile,
    AgreementMetadata,
    DeliverableSubmission,
    DisputeCase,
    TransactionEvent,
    Notification,
)
from .serializers import (
    UserProfileSerializer,
    AgreementMetadataSerializer,
    DeliverableSubmissionSerializer,
    DisputeCaseSerializer,
    TransactionEventSerializer,
    NotificationSerializer,
)
from .auth import create_auth_challenge, verify_wallet_signature

class AuthNonceView(APIView):
    def get(self, request):
        address = request.query_params.get('address')
        if not address:
            return Response({'error': 'Query parameter "address" is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        nonce, message = create_auth_challenge(address)
        return Response({
            'address': address.lower(),
            'nonce': nonce,
            'message': message,
        })

class AuthVerifyView(APIView):
    def post(self, request):
        address = request.data.get('address')
        nonce = request.data.get('nonce')
        signature = request.data.get('signature')

        if not address or not nonce or not signature:
            return Response({'error': 'address, nonce, and signature are required.'}, status=status.HTTP_400_BAD_REQUEST)

        valid, msg, wallet = verify_wallet_signature(address, nonce, signature)
        if not valid or not wallet:
            return Response({'error': msg}, status=status.HTTP_401_UNAUTHORIZED)

        profile = getattr(wallet, 'profile', None)
        profile_data = UserProfileSerializer(profile).data if profile else {}

        return Response({
            'verified': True,
            'message': msg,
            'wallet': wallet.address,
            'profile': profile_data,
        })

class UserProfileView(APIView):
    def get(self, request):
        address = request.query_params.get('address')
        if not address:
            return Response({'error': 'address parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        wallet = WalletAccount.objects.filter(address=address.lower()).first()
        if not wallet or not hasattr(wallet, 'profile'):
            return Response({'error': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        return Response(UserProfileSerializer(wallet.profile).data)

    def put(self, request):
        address = request.data.get('address')
        if not address:
            return Response({'error': 'address is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        wallet, _ = WalletAccount.objects.get_or_create(address=address.lower())
        profile, _ = UserProfile.objects.get_or_create(wallet=wallet)
        
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AgreementMetadataViewSet(viewsets.ModelViewSet):
    queryset = AgreementMetadata.objects.all().order_by('-created_at')
    serializer_class = AgreementMetadataSerializer
    lookup_field = 'agreement_id'

    def get_queryset(self):
        qs = super().get_queryset()
        address = self.request.query_params.get('address')
        if address:
            norm = address.lower()
            qs = qs.filter(client_address=norm) | qs.filter(freelancer_address=norm)
        return qs

class DeliverableSubmissionViewSet(viewsets.ModelViewSet):
    queryset = DeliverableSubmission.objects.all().order_by('-submitted_at')
    serializer_class = DeliverableSubmissionSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        agreement_id = self.request.query_params.get('agreement_id')
        if agreement_id:
            qs = qs.filter(agreement_id=agreement_id)
        return qs

class DisputeCaseViewSet(viewsets.ModelViewSet):
    queryset = DisputeCase.objects.all().order_by('-created_at')
    serializer_class = DisputeCaseSerializer

class TransactionEventViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TransactionEvent.objects.all().order_by('-indexed_at')
    serializer_class = TransactionEventSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        agreement_id = self.request.query_params.get('agreement_id')
        if agreement_id:
            qs = qs.filter(agreement_id=agreement_id)
        return qs

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer

    def get_queryset(self):
        address = self.request.query_params.get('address')
        if address:
            return self.queryset.filter(wallet_address=address.lower())
        return self.queryset

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save(update_fields=['is_read'])
        return Response({'status': 'marked read'})
