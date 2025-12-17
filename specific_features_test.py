import requests
import sys
from datetime import datetime
import json

class SpecificFeaturesAPITester:
    def __init__(self, base_url="https://mentoria-portal.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.mentorada_token = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.text else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")

            return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login(self):
        """Test both admin and mentorada login"""
        print("\n=== TESTING AUTHENTICATION ===")
        
        # Admin login
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "jussarakaiselvc@gmail.com", "password": "jussara123"}
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            print(f"✅ Admin token obtained")
        else:
            return False
        
        # Mentorada login
        success, response = self.run_test(
            "Mentorada Login",
            "POST",
            "auth/login",
            200,
            data={"email": "karina_kiriki@icloud.com", "password": "mentorada123"}
        )
        if success and 'token' in response:
            self.mentorada_token = response['token']
            print(f"✅ Mentorada token obtained")
            return True
        return False

    def test_scheduling_settings_admin(self):
        """Test admin scheduling settings endpoints"""
        print("\n=== TESTING ADMIN SCHEDULING SETTINGS ===")
        
        # Test GET scheduling settings
        success, response = self.run_test(
            "Get Admin Scheduling Settings",
            "GET",
            "admin/scheduling-settings",
            200,
            token=self.admin_token
        )
        
        if not success:
            return False
        
        # Test PUT scheduling settings
        settings_data = {
            "calendly_url": "https://calendly.com/jussara-kaisel-test",
            "youcanbookme_url": "https://jussara-kaisel.youcanbook.me",
            "google_calendar_id": "jussarakaiselvc@gmail.com"
        }
        
        success, response = self.run_test(
            "Update Admin Scheduling Settings",
            "PUT",
            "admin/scheduling-settings",
            200,
            data=settings_data,
            token=self.admin_token
        )
        
        return success

    def test_scheduling_links_public(self):
        """Test public scheduling links endpoint for mentoradas"""
        print("\n=== TESTING PUBLIC SCHEDULING LINKS ===")
        
        success, response = self.run_test(
            "Get Scheduling Links (Mentorada)",
            "GET",
            "scheduling-links",
            200,
            token=self.mentorada_token
        )
        
        if success:
            print(f"✅ Scheduling links response: {response}")
            # Check if has_links is properly set
            if 'has_links' in response:
                print(f"✅ Has links flag: {response['has_links']}")
            return True
        
        return False

    def test_profile_update_country_currency_phone(self):
        """Test profile update with country, currency, and phone"""
        print("\n=== TESTING PROFILE UPDATE (COUNTRY/CURRENCY/PHONE) ===")
        
        profile_data = {
            "country": "Brasil",
            "country_code": "BR",
            "currency": "BRL",
            "phone": "(11) 99999-9999"
        }
        
        success, response = self.run_test(
            "Update Profile with Country/Currency/Phone",
            "PUT",
            "me/profile",
            200,
            data=profile_data,
            token=self.mentorada_token
        )
        
        if success:
            print(f"✅ Profile updated with country: {response.get('country')}, currency: {response.get('currency')}")
            return True
        
        return False

    def test_sessoes_from_all_mentorias(self):
        """Test that sessoes endpoint returns sessions from ALL mentorias"""
        print("\n=== TESTING SESSOES FROM ALL MENTORIAS ===")
        
        # Get mentorada's mentorias
        success, mentorias_response = self.run_test(
            "Get Mentorada Mentorias",
            "GET",
            "mentorada-mentorias/my",
            200,
            token=self.mentorada_token
        )
        
        if not success:
            return False
        
        print(f"✅ Found {len(mentorias_response)} mentorias for user")
        
        # Test sessions endpoint - should get from all mentorias
        for mentoria in mentorias_response:
            success, sessions_response = self.run_test(
                f"Get Sessions for Mentoria {mentoria['mentorada_mentoria_id'][:8]}...",
                "GET",
                f"sessoes/mentoria/{mentoria['mentorada_mentoria_id']}",
                200,
                token=self.mentorada_token
            )
            
            if success:
                print(f"✅ Found {len(sessions_response)} sessions for this mentoria")
        
        return True

    def test_financeiro_from_all_mentorias(self):
        """Test that financeiro endpoint works with multiple mentorias"""
        print("\n=== TESTING FINANCEIRO FROM ALL MENTORIAS ===")
        
        # Get mentorada's mentorias
        success, mentorias_response = self.run_test(
            "Get Mentorada Mentorias for Financeiro",
            "GET",
            "mentorada-mentorias/my",
            200,
            token=self.mentorada_token
        )
        
        if not success:
            return False
        
        # Test financeiro endpoint for each mentoria
        for mentoria in mentorias_response:
            success, financeiro_response = self.run_test(
                f"Get Financeiro for Mentoria {mentoria['mentorada_mentoria_id'][:8]}...",
                "GET",
                f"financeiro/mentoria/{mentoria['mentorada_mentoria_id']}",
                [200, 404],  # 404 is OK if no financeiro exists
                token=self.mentorada_token
            )
            
            if success:
                print(f"✅ Financeiro endpoint accessible for this mentoria")
        
        return True

    def test_minha_mentoria_showcase(self):
        """Test minha mentoria showcase with locked content"""
        print("\n=== TESTING MINHA MENTORIA SHOWCASE ===")
        
        # Get all available mentorias (showcase)
        success, all_mentorias_response = self.run_test(
            "Get All Mentorias (Showcase)",
            "GET",
            "mentorias",
            200,
            token=self.mentorada_token
        )
        
        if success:
            print(f"✅ Found {len(all_mentorias_response)} mentorias in showcase")
            
            # Get user's assigned mentorias
            success, my_mentorias_response = self.run_test(
                "Get My Mentorias",
                "GET",
                "mentorada-mentorias/my",
                200,
                token=self.mentorada_token
            )
            
            if success:
                my_mentoria_ids = [m['mentoria_id'] for m in my_mentorias_response]
                locked_count = 0
                unlocked_count = 0
                
                for mentoria in all_mentorias_response:
                    if mentoria['mentoria_id'] in my_mentoria_ids:
                        unlocked_count += 1
                        print(f"✅ Unlocked: {mentoria['name']}")
                    else:
                        locked_count += 1
                        print(f"🔒 Locked: {mentoria['name']}")
                
                print(f"✅ Showcase working: {unlocked_count} unlocked, {locked_count} locked")
                return True
        
        return False

    def test_admin_agendamentos_integration(self):
        """Test admin agendamentos integration"""
        print("\n=== TESTING ADMIN AGENDAMENTOS INTEGRATION ===")
        
        # Get all agendamentos (admin view)
        success, agendamentos_response = self.run_test(
            "Get All Agendamentos (Admin)",
            "GET",
            "agendamentos",
            200,
            token=self.admin_token
        )
        
        if success:
            print(f"✅ Found {len(agendamentos_response)} agendamentos")
            return True
        
        return False

    def test_admin_financeiro_dynamic_parcelas(self):
        """Test admin financeiro with dynamic parcelas management"""
        print("\n=== TESTING ADMIN FINANCEIRO DYNAMIC PARCELAS ===")
        
        # Get financeiro overview
        success, overview_response = self.run_test(
            "Get Admin Financeiro Overview",
            "GET",
            "admin/financeiro-overview",
            200,
            token=self.admin_token
        )
        
        if success:
            print(f"✅ Found {len(overview_response)} financeiro records")
            
            # Test dynamic parcela operations if we have financeiro records
            if len(overview_response) > 0:
                financeiro_id = overview_response[0]['financeiro_id']
                
                # Test add parcela
                new_parcela_data = {
                    "financeiro_id": financeiro_id,
                    "valor": 100.00,
                    "data_vencimento": "2024-12-31T00:00:00Z"
                }
                
                success, add_response = self.run_test(
                    "Add Dynamic Parcela",
                    "POST",
                    "parcelas/add",
                    200,
                    data=new_parcela_data,
                    token=self.admin_token
                )
                
                if success and 'parcela_id' in add_response:
                    parcela_id = add_response['parcela_id']
                    
                    # Test edit parcela
                    edit_data = {
                        "valor": 150.00,
                        "status": "paga",
                        "data_pagamento": datetime.now().isoformat()
                    }
                    
                    success, edit_response = self.run_test(
                        "Edit Dynamic Parcela",
                        "PATCH",
                        f"parcelas/{parcela_id}",
                        200,
                        data=edit_data,
                        token=self.admin_token
                    )
                    
                    if success:
                        # Test delete parcela
                        success, delete_response = self.run_test(
                            "Delete Dynamic Parcela",
                            "DELETE",
                            f"parcelas/{parcela_id}",
                            200,
                            token=self.admin_token
                        )
                        
                        if success:
                            print(f"✅ Dynamic parcela management working")
                            return True
        
        return False

def main():
    print("🚀 Starting Specific Features API Tests")
    print("=" * 60)
    
    tester = SpecificFeaturesAPITester()
    
    # Test authentication first
    if not tester.test_login():
        print("❌ Authentication failed, stopping tests")
        return 1
    
    # Test specific features from review request
    tests = [
        tester.test_scheduling_settings_admin,
        tester.test_scheduling_links_public,
        tester.test_profile_update_country_currency_phone,
        tester.test_sessoes_from_all_mentorias,
        tester.test_financeiro_from_all_mentorias,
        tester.test_minha_mentoria_showcase,
        tester.test_admin_agendamentos_integration,
        tester.test_admin_financeiro_dynamic_parcelas
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 SPECIFIC FEATURES TEST RESULTS")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All specific features tests passed!")
        return 0
    else:
        print("⚠️  Some specific features tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())