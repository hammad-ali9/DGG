import os
import django
import sys
from decimal import Decimal

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import PolicySetting
from api.services import FundingCalculationService

def test_funding_service_crash():
    print("Testing FundingCalculationService with CharField values...")
    
    # 1. Setup a test policy setting with a string value (since it's now a CharField)
    PolicySetting.objects.all().delete()
    PolicySetting.objects.create(
        key='tuition_cap_psssp',
        setting_type='tuition_cap',
        stream='PSSSP',
        value='5000.00',
        is_active=True
    )
    
    try:
        # This calls get_tuition_cap which returns policy_setting.value
        val = FundingCalculationService.get_tuition_cap('PSSSP')
        print(f"DEBUG: get_tuition_cap returned {type(val)}: {val}")
        
        # This will fail if val is a string
        total = Decimal('0.00') + val
        print(f"SUCCESS: Result is {total}")
    except TypeError as e:
        print(f"CAUGHT EXPECTED ERROR: {e}")
    except Exception as e:
        print(f"CAUGHT UNEXPECTED ERROR: {type(e).__name__}: {e}")

if __name__ == "__main__":
    test_funding_service_crash()
