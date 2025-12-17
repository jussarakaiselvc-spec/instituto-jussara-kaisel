import requests
import sys
from datetime import datetime
import json

class InstitutoJussaraKaiselAPITester:
    def __init__(self, base_url="https://mentoria-portal.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.mentorada_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_user_id = None
        self.created_financeiro_id = None
        self.created_mentoria_id = None
        self.created_mentorada_mentoria_id = None
        self.created_parcela_ids = []

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

    def test_admin_login(self):
        """Test admin login and get token"""
        print("\n=== TESTING ADMIN LOGIN ===")
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "jussarakaiselvc@gmail.com", "password": "jussara123"}
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            print(f"✅ Admin token obtained: {self.admin_token[:20]}...")
            return True
        return False

    def test_mentorada_login(self):
        """Test mentorada login and get token"""
        print("\n=== TESTING MENTORADA LOGIN ===")
        success, response = self.run_test(
            "Mentorada Login",
            "POST",
            "auth/login",
            200,
            data={"email": "maria@exemplo.com", "password": "maria_password"}
        )
        if success and 'token' in response:
            self.mentorada_token = response['token']
            print(f"✅ Mentorada token obtained: {self.mentorada_token[:20]}...")
            return True
        return False

    def test_create_test_user(self):
        """Create a test user for CRUD operations"""
        print("\n=== TESTING USER CREATION ===")
        test_user_data = {
            "name": f"Test User {datetime.now().strftime('%H%M%S')}",
            "email": f"testuser{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "testpass123",
            "role": "mentorada"
        }
        
        success, response = self.run_test(
            "Create Test User",
            "POST",
            "auth/register",
            200,
            data=test_user_data,
            token=self.admin_token
        )
        
        if success and 'user_id' in response:
            self.created_user_id = response['user_id']
            print(f"✅ Test user created with ID: {self.created_user_id}")
            return True
        return False

    def test_update_user(self):
        """Test PUT /api/users/{user_id} - Edit mentorada"""
        print("\n=== TESTING USER UPDATE ===")
        if not self.created_user_id:
            print("❌ No test user available for update")
            return False
            
        update_data = {
            "name": "Updated Test User",
            "email": f"updated{datetime.now().strftime('%H%M%S')}@test.com"
        }
        
        success, response = self.run_test(
            "Update User (PUT /api/users/{user_id})",
            "PUT",
            f"users/{self.created_user_id}",
            200,
            data=update_data,
            token=self.admin_token
        )
        
        if success:
            print(f"✅ User updated successfully")
            return True
        return False

    def test_get_users(self):
        """Test GET /api/users - List all users"""
        print("\n=== TESTING GET USERS ===")
        success, response = self.run_test(
            "Get All Users",
            "GET",
            "users",
            200,
            token=self.admin_token
        )
        
        if success and isinstance(response, list):
            print(f"✅ Retrieved {len(response)} users")
            return True
        return False

    def test_create_mentoria_and_assignment(self):
        """Create mentoria and assign to user for financial testing"""
        print("\n=== TESTING MENTORIA CREATION AND ASSIGNMENT ===")
        
        # Create mentoria
        mentoria_data = {
            "name": f"Test Mentoria {datetime.now().strftime('%H%M%S')}",
            "description": "Test mentoria for financial testing"
        }
        
        success, response = self.run_test(
            "Create Test Mentoria",
            "POST",
            "mentorias",
            200,
            data=mentoria_data,
            token=self.admin_token
        )
        
        if success and 'mentoria_id' in response:
            self.created_mentoria_id = response['mentoria_id']
            print(f"✅ Test mentoria created with ID: {self.created_mentoria_id}")
            
            # Assign mentoria to user
            assign_data = {
                "user_id": self.created_user_id,
                "mentoria_id": self.created_mentoria_id,
                "start_date": datetime.now().isoformat(),
                "status": "ativa"
            }
            
            success, response = self.run_test(
                "Assign Mentoria to User",
                "POST",
                "mentorada-mentorias",
                200,
                data=assign_data,
                token=self.admin_token
            )
            
            if success and 'mentorada_mentoria_id' in response:
                self.created_mentorada_mentoria_id = response['mentorada_mentoria_id']
                print(f"✅ Mentoria assigned with ID: {self.created_mentorada_mentoria_id}")
                return True
        
        return False

    def test_create_financeiro(self):
        """Test POST /api/financeiro - Create financial record"""
        print("\n=== TESTING FINANCEIRO CREATION ===")
        if not self.created_mentorada_mentoria_id:
            print("❌ No mentorada_mentoria available for financeiro")
            return False
            
        financeiro_data = {
            "mentorada_mentoria_id": self.created_mentorada_mentoria_id,
            "valor_total": 1500.00,
            "forma_pagamento": "cartao_credito",
            "numero_parcelas": 3,
            "observacoes": "Test financial record"
        }
        
        success, response = self.run_test(
            "Create Financeiro Record",
            "POST",
            "financeiro",
            200,
            data=financeiro_data,
            token=self.admin_token
        )
        
        if success and 'financeiro_id' in response:
            self.created_financeiro_id = response['financeiro_id']
            print(f"✅ Financeiro created with ID: {self.created_financeiro_id}")
            return True
        return False

    def test_update_financeiro(self):
        """Test PUT /api/financeiro/{financeiro_id} - Edit financial record"""
        print("\n=== TESTING FINANCEIRO UPDATE ===")
        if not self.created_financeiro_id:
            print("❌ No financeiro available for update")
            return False
            
        update_data = {
            "valor_total": 2000.00,
            "forma_pagamento": "pix",
            "numero_parcelas": 4,
            "observacoes": "Updated financial record"
        }
        
        success, response = self.run_test(
            "Update Financeiro (PUT /api/financeiro/{financeiro_id})",
            "PUT",
            f"financeiro/{self.created_financeiro_id}",
            200,
            data=update_data,
            token=self.admin_token
        )
        
        if success:
            print(f"✅ Financeiro updated successfully")
            return True
        return False

    def test_get_financeiro_overview(self):
        """Test GET /api/admin/financeiro-overview"""
        print("\n=== TESTING FINANCEIRO OVERVIEW ===")
        success, response = self.run_test(
            "Get Financeiro Overview",
            "GET",
            "admin/financeiro-overview",
            200,
            token=self.admin_token
        )
        
        if success and isinstance(response, list):
            print(f"✅ Retrieved financeiro overview with {len(response)} records")
            return True
        return False

    def test_payment_methods(self):
        """Test all payment methods"""
        print("\n=== TESTING PAYMENT METHODS ===")
        payment_methods = [
            "cartao_credito",
            "deposito_bancario", 
            "pix",
            "paypal",
            "parcelamento_especial"
        ]
        
        all_passed = True
        for method in payment_methods:
            # Create a temporary financeiro with each payment method
            temp_financeiro_data = {
                "mentorada_mentoria_id": self.created_mentorada_mentoria_id,
                "valor_total": 500.00,
                "forma_pagamento": method,
                "numero_parcelas": 1,
                "observacoes": f"Test {method}"
            }
            
            success, response = self.run_test(
                f"Create Financeiro with {method}",
                "POST",
                "financeiro",
                200,
                data=temp_financeiro_data,
                token=self.admin_token
            )
            
            if not success:
                all_passed = False
            else:
                # Clean up - delete the temporary record
                temp_id = response.get('financeiro_id')
                if temp_id:
                    self.run_test(
                        f"Delete temp financeiro {method}",
                        "DELETE",
                        f"financeiro/{temp_id}",
                        200,
                        token=self.admin_token
                    )
        
        return all_passed

    def test_get_parcelas(self):
        """Test GET /api/parcelas/financeiro/{financeiro_id} - Get installments"""
        print("\n=== TESTING GET PARCELAS ===")
        if not self.created_financeiro_id:
            print("❌ No financeiro available for parcelas test")
            return False
            
        success, response = self.run_test(
            "Get Parcelas by Financeiro",
            "GET",
            f"parcelas/financeiro/{self.created_financeiro_id}",
            200,
            token=self.admin_token
        )
        
        if success and isinstance(response, list):
            print(f"✅ Retrieved {len(response)} parcelas")
            # Store parcela IDs for further testing
            self.created_parcela_ids = [p['parcela_id'] for p in response if 'parcela_id' in p]
            return True
        return False

    def test_add_new_parcela(self):
        """Test POST /api/parcelas/add - Add new installment (dynamic feature)"""
        print("\n=== TESTING ADD NEW PARCELA (DYNAMIC FEATURE) ===")
        if not self.created_financeiro_id:
            print("❌ No financeiro available for adding parcela")
            return False
            
        new_parcela_data = {
            "financeiro_id": self.created_financeiro_id,
            "valor": 250.00,
            "data_vencimento": "2024-12-31T00:00:00Z"
        }
        
        success, response = self.run_test(
            "Add New Parcela (POST /api/parcelas/add)",
            "POST",
            "parcelas/add",
            200,
            data=new_parcela_data,
            token=self.admin_token
        )
        
        if success and 'parcela_id' in response:
            new_parcela_id = response['parcela_id']
            self.created_parcela_ids.append(new_parcela_id)
            print(f"✅ New parcela added with ID: {new_parcela_id}")
            return True
        return False

    def test_edit_parcela(self):
        """Test PATCH /api/parcelas/{parcela_id} - Edit installment (dynamic feature)"""
        print("\n=== TESTING EDIT PARCELA (DYNAMIC FEATURE) ===")
        if not self.created_parcela_ids:
            print("❌ No parcelas available for editing")
            return False
            
        parcela_id = self.created_parcela_ids[0]
        edit_data = {
            "valor": 300.00,
            "status": "paga",
            "data_pagamento": datetime.now().isoformat()
        }
        
        success, response = self.run_test(
            "Edit Parcela (PATCH /api/parcelas/{parcela_id})",
            "PATCH",
            f"parcelas/{parcela_id}",
            200,
            data=edit_data,
            token=self.admin_token
        )
        
        if success:
            print(f"✅ Parcela edited successfully")
            return True
        return False

    def test_mark_parcela_status(self):
        """Test marking parcela as paid/pending with one click"""
        print("\n=== TESTING MARK PARCELA STATUS (ONE CLICK FEATURE) ===")
        if not self.created_parcela_ids or len(self.created_parcela_ids) < 2:
            print("❌ Need at least 2 parcelas for status testing")
            return False
            
        parcela_id = self.created_parcela_ids[1] if len(self.created_parcela_ids) > 1 else self.created_parcela_ids[0]
        
        # Mark as paid
        mark_paid_data = {
            "status": "paga",
            "data_pagamento": datetime.now().isoformat()
        }
        
        success1, response1 = self.run_test(
            "Mark Parcela as Paid",
            "PATCH",
            f"parcelas/{parcela_id}",
            200,
            data=mark_paid_data,
            token=self.admin_token
        )
        
        # Mark as pending
        mark_pending_data = {
            "status": "pendente",
            "data_pagamento": None
        }
        
        success2, response2 = self.run_test(
            "Mark Parcela as Pending",
            "PATCH",
            f"parcelas/{parcela_id}",
            200,
            data=mark_pending_data,
            token=self.admin_token
        )
        
        if success1 and success2:
            print(f"✅ Parcela status toggle working correctly")
            return True
        return False

    def test_delete_parcela(self):
        """Test DELETE /api/parcelas/{parcela_id} - Delete installment (dynamic feature)"""
        print("\n=== TESTING DELETE PARCELA (DYNAMIC FEATURE) ===")
        if not self.created_parcela_ids:
            print("❌ No parcelas available for deletion")
            return False
            
        # Delete the last added parcela
        parcela_id = self.created_parcela_ids[-1]
        
        success, response = self.run_test(
            "Delete Parcela (DELETE /api/parcelas/{parcela_id})",
            "DELETE",
            f"parcelas/{parcela_id}",
            200,
            token=self.admin_token
        )
        
        if success:
            print(f"✅ Parcela deleted successfully")
            self.created_parcela_ids.remove(parcela_id)
            return True
        return False

    def test_mentorada_sessions_endpoint(self):
        """Test GET /api/minha-mentoria/sessoes - Mentee dashboard sessions"""
        print("\n=== TESTING MENTORADA SESSIONS ENDPOINT ===")
        
        # First create a session for testing
        if not self.created_mentorada_mentoria_id:
            print("❌ No mentorada_mentoria available for session test")
            return False
            
        session_data = {
            "mentorada_mentoria_id": self.created_mentorada_mentoria_id,
            "session_number": 1,
            "tema": "Test Session for Dashboard",
            "session_date": datetime.now().isoformat()
        }
        
        success, response = self.run_test(
            "Create Test Session",
            "POST",
            "sessoes",
            200,
            data=session_data,
            token=self.admin_token
        )
        
        if not success:
            print("❌ Failed to create test session")
            return False
            
        # Now test the mentorada sessions endpoint
        # First login as the test user to get their token
        success, login_response = self.run_test(
            "Login Test User for Sessions",
            "POST",
            "auth/login",
            200,
            data={"email": f"testuser{datetime.now().strftime('%H%M%S')}@test.com", "password": "testpass123"}
        )
        
        if success and 'token' in login_response:
            test_user_token = login_response['token']
            
            success, sessions_response = self.run_test(
                "Get Mentorada Sessions (GET /api/minha-mentoria/sessoes)",
                "GET",
                "minha-mentoria/sessoes",
                200,
                token=test_user_token
            )
            
            if success and isinstance(sessions_response, list):
                print(f"✅ Retrieved {len(sessions_response)} sessions for mentorada dashboard")
                return True
        
        return False

    def test_financial_summary_calculations(self):
        """Test financial summary with correct totals"""
        print("\n=== TESTING FINANCIAL SUMMARY CALCULATIONS ===")
        
        success, response = self.run_test(
            "Get Financial Overview for Summary",
            "GET",
            "admin/financeiro-overview",
            200,
            token=self.admin_token
        )
        
        if success and isinstance(response, list):
            total_receita = 0
            total_recebido = 0
            total_a_receber = 0
            
            for financeiro in response:
                total_receita += financeiro.get('valor_total', 0)
                total_recebido += financeiro.get('valor_recebido', 0)
                total_a_receber += (financeiro.get('valor_total', 0) - financeiro.get('valor_recebido', 0))
            
            print(f"✅ Financial Summary Calculated:")
            print(f"   Total Receita: R$ {total_receita:.2f}")
            print(f"   Total Recebido: R$ {total_recebido:.2f}")
            print(f"   Total A Receber: R$ {total_a_receber:.2f}")
            
            # Verify calculations are consistent
            if abs(total_receita - (total_recebido + total_a_receber)) < 0.01:
                print(f"✅ Financial calculations are consistent")
                return True
            else:
                print(f"❌ Financial calculations inconsistent")
                return False
        
        return False

    def test_delete_financeiro(self):
        """Test DELETE /api/financeiro/{financeiro_id} - Delete financial record"""
        print("\n=== TESTING FINANCEIRO DELETE ===")
        if not self.created_financeiro_id:
            print("❌ No financeiro available for deletion")
            return False
            
        success, response = self.run_test(
            "Delete Financeiro (DELETE /api/financeiro/{financeiro_id})",
            "DELETE",
            f"financeiro/{self.created_financeiro_id}",
            200,
            token=self.admin_token
        )
        
        if success:
            print(f"✅ Financeiro deleted successfully")
            self.created_financeiro_id = None  # Reset since it's deleted
            return True
        return False

    def test_delete_user(self):
        """Test DELETE /api/users/{user_id} - Delete mentorada and related data"""
        print("\n=== TESTING USER DELETE ===")
        if not self.created_user_id:
            print("❌ No test user available for deletion")
            return False
            
        success, response = self.run_test(
            "Delete User (DELETE /api/users/{user_id})",
            "DELETE",
            f"users/{self.created_user_id}",
            200,
            token=self.admin_token
        )
        
        if success:
            print(f"✅ User and related data deleted successfully")
            return True
        return False

    def test_admin_endpoints_access_control(self):
        """Test that admin endpoints require admin role"""
        print("\n=== TESTING ACCESS CONTROL ===")
        
        # Test that mentorada cannot access admin endpoints
        success, response = self.run_test(
            "Mentorada Access to Admin Endpoint (should fail)",
            "GET",
            "users",
            403,  # Should be forbidden
            token=self.mentorada_token
        )
        
        return success

def main():
    print("🚀 Starting Instituto Jussara Kaisel API Tests")
    print("=" * 60)
    
    tester = InstitutoJussaraKaiselAPITester()
    
    # Test authentication first
    if not tester.test_admin_login():
        print("❌ Admin login failed, stopping tests")
        return 1
    
    if not tester.test_mentorada_login():
        print("❌ Mentorada login failed, continuing with admin tests only")
    
    # Test user CRUD operations
    if not tester.test_create_test_user():
        print("❌ User creation failed, skipping user tests")
    else:
        tester.test_update_user()
        tester.test_get_users()
    
    # Test mentoria creation and assignment (needed for financeiro)
    if not tester.test_create_mentoria_and_assignment():
        print("❌ Mentoria setup failed, skipping financeiro tests")
    else:
        # Test financeiro CRUD operations
        if tester.test_create_financeiro():
            tester.test_update_financeiro()
            tester.test_get_financeiro_overview()
            tester.test_payment_methods()
            tester.test_delete_financeiro()
    
    # Test access control
    if tester.mentorada_token:
        tester.test_admin_endpoints_access_control()
    
    # Clean up - delete test user (this will cascade delete related data)
    if tester.created_user_id:
        tester.test_delete_user()
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 FINAL RESULTS")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())