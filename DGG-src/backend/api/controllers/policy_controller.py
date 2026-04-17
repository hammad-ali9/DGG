from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from api.utils.responses import api_response
from api.models import PolicySetting, PolicyHistory
from api.serializers import PolicySettingSerializer, PolicyHistorySerializer
from users.permissions import IsAdminUser

class PolicyViewSet(viewsets.ModelViewSet):
    queryset = PolicySetting.objects.all()
    serializer_class = PolicySettingSerializer
    permission_classes = [IsAdminUser]
    lookup_field = 'category'

    def get_queryset(self):
        return PolicySetting.objects.all().order_by('category')

    @action(detail=True, methods=['post', 'put'], url_path='update')
    def update_policy(self, request, category=None):
        policy, created = PolicySetting.objects.get_or_create(category=category)
        old_data = policy.data
        new_data = request.data.get('data')
        
        if new_data is not None:
            # Check for history if we want to be fancy, but for now let's just save
            history_item = request.data.get('history_item')
            if history_item:
                PolicyHistory.objects.create(
                    setting=policy,
                    user_name=f"{request.user.first_name} {request.user.last_name}" or request.user.username,
                    field_changed=history_item.get('field', 'Multiple fields'),
                    old_value=history_item.get('old', 'N/A'),
                    new_value=history_item.get('new', 'N/A'),
                    effective_date=history_item.get('effective', 'N/A')
                )
            
            policy.data = new_data
            policy.updated_by = request.user
            policy.save()
            return api_response(True, PolicySettingSerializer(policy).data, f"Policy {category} updated")
        
        return api_response(False, None, "No data provided", status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def all_settings(self, request):
        settings = self.get_queryset()
        serializer = self.get_serializer(settings, many=True)
        # Convert list to dict for easier frontend consumption
        result = {item['category']: item for item in serializer.data}
        return api_response(True, result, "All policy settings retrieved")
