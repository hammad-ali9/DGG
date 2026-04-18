"""Verify PolicySetting records were created"""
from api.models import PolicySetting

count = PolicySetting.objects.count()
print(f"Total PolicySettings: {count}")

# Show first 5
for s in PolicySetting.objects.all()[:5]:
    print(f"  {s.key}: ${s.value}")

if count > 5:
    print(f"  ... and {count - 5} more")
