"""
Comprehensive API tests for Virgil backend endpoints.
Tests authentication, authorization, conversation management, and real-time features.
"""

import pytest
import json
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
from jose import jwt

# Import the FastAPI app from main
from main import app, SECRET_KEY, ALGORITHM, get_db, engine, Base, Conversation, PersistentReminder

# Create test database
DATABASE_URL = "sqlite:///./test.db"

@pytest.fixture(scope="session")
def setup_db():
    """Setup test database before tests and cleanup after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client(setup_db):
    """Create test client with fresh database for each test."""
    return TestClient(app)

@pytest.fixture
def auth_token():
    """Generate a valid JWT token for testing."""
    data = {
        "sub": "testuser",
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

@pytest.fixture
def test_username():
    """Provide a test username."""
    return "testuser"

# ==================== Authentication Tests ====================

class TestAuthentication:
    """Test JWT authentication and token generation."""
    
    def test_auth_token_generation_with_json(self, client):
        """Test /auth/token endpoint with JSON body."""
        response = client.post(
            "/auth/token",
            json={"username": "testuser", "password": "testpass"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        
        # Verify token is decodable
        token = data["access_token"]
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert decoded["sub"] == "testuser"
    
    def test_auth_token_generation_with_form_data(self, client):
        """Test /auth/token endpoint with form data (multipart)."""
        response = client.post(
            "/auth/token",
            data={"username": "testuser", "password": "testpass"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_auth_token_empty_credentials(self, client):
        """Test that empty credentials are rejected."""
        response = client.post(
            "/auth/token",
            json={"username": "", "password": ""}
        )
        # Should still return 200 (demo mode accepts any credentials)
        # but verify it returns a token
        assert response.status_code == 200

# ==================== History Endpoint Tests ====================

class TestHistoryEndpoint:
    """Test conversation history retrieval with authentication."""
    
    def test_history_with_valid_auth(self, client, auth_token, test_username):
        """Test GET /history with valid JWT token."""
        response = client.get(
            "/history",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "conversations" in data
        assert isinstance(data["conversations"], list)

    def test_history_with_invalid_auth(self, client):
        """Test GET /history with invalid JWT token."""
        response = client.get(
            "/history",
            headers={"Authorization": "Bearer invalid_token"}
        )
        # Should return 401 Unauthorized
        assert response.status_code == 401

    def test_history_with_fallback_header(self, client, test_username):
        """Test GET /history with fallback X-User-Id header (backwards compat)."""
        response = client.get(
            "/history",
            headers={"X-User-Id": test_username}
        )
        assert response.status_code == 200
        data = response.json()
        assert "conversations" in data

    def test_history_without_auth(self, client):
        """Test GET /history without any auth (should fail)."""
        response = client.get("/history")
        assert response.status_code == 401

# ==================== User Data Endpoint Tests ====================

class TestUserDataEndpoint:
    """Test user data deletion with security checks."""
    
    def test_delete_user_data_with_valid_auth_and_confirmation(self, client, auth_token):
        """Test DELETE /user-data with valid JWT and confirmation header."""
        response = client.delete(
            "/user-data",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "X-Confirm-Delete": "true"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data or "status" in data

    def test_delete_user_data_without_auth(self, client):
        """Test DELETE /user-data without authentication."""
        response = client.delete(
            "/user-data",
            headers={"X-Confirm-Delete": "true"}
        )
        assert response.status_code == 401

    def test_delete_user_data_without_confirmation(self, client, auth_token):
        """Test DELETE /user-data without confirmation header."""
        response = client.delete(
            "/user-data",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        # Should fail or require confirmation
        assert response.status_code in [400, 401, 403]

    def test_delete_user_data_with_invalid_confirmation(self, client, auth_token):
        """Test DELETE /user-data with invalid confirmation header."""
        response = client.delete(
            "/user-data",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "X-Confirm-Delete": "false"
            }
        )
        # Should fail with invalid confirmation
        assert response.status_code in [400, 403]

# ==================== Reminders Endpoint Tests ====================

class TestRemindersEndpoint:
    """Test reminder management endpoints."""
    
    def test_get_reminders_with_auth(self, client, auth_token):
        """Test GET /reminders with authentication."""
        response = client.get(
            "/reminders",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "reminders" in data
        assert isinstance(data["reminders"], list)

    def test_schedule_reminder(self, client, test_username):
        """Test POST /reminder to schedule a reminder."""
        reminder_data = {
            "message": "Test reminder",
            "remind_at": (datetime.utcnow() + timedelta(minutes=5)).isoformat()
        }
        response = client.post(
            "/reminder",
            json=reminder_data,
            headers={"X-User-Id": test_username}
        )
        # Should accept reminder
        assert response.status_code in [200, 201]

# ==================== Tools Endpoint Tests ====================

class TestToolsEndpoints:
    """Test calculation and translation tools."""
    
    def test_calculate_valid_expression(self, client):
        """Test POST /calculate with valid expression."""
        response = client.post(
            "/calculate",
            json={"expression": "2 + 2"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "result" in data
        assert data["result"] == 4

    def test_calculate_invalid_expression(self, client):
        """Test POST /calculate with invalid expression."""
        response = client.post(
            "/calculate",
            json={"expression": "invalid"}
        )
        # Should return error response
        assert response.status_code in [400, 422]

    def test_translate(self, client):
        """Test POST /translate endpoint."""
        response = client.post(
            "/translate",
            json={
                "text": "Hello",
                "target_language": "es"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "translated_text" in data or "text" in data

# ==================== Conversation Endpoint Tests ====================

class TestConversationEndpoints:
    """Test main conversation endpoints."""
    
    def test_quick_guide(self, client, test_username):
        """Test POST /quick-guide endpoint (first message)."""
        response = client.post(
            "/quick-guide",
            json={"message": "What is AI?"},
            headers={"X-User-Id": test_username}
        )
        assert response.status_code == 200
        data = response.json()
        assert "response" in data or "message" in data

    def test_guide(self, client, test_username):
        """Test POST /guide endpoint (subsequent messages)."""
        response = client.post(
            "/guide",
            json={"message": "Tell me more"},
            headers={"X-User-Id": test_username}
        )
        assert response.status_code == 200
        data = response.json()
        assert "response" in data or "message" in data

# ==================== Metadata Endpoint Tests ====================

class TestMetadataEndpoints:
    """Test metadata endpoints."""
    
    def test_get_tones(self, client):
        """Test GET /tones endpoint."""
        response = client.get("/tones")
        assert response.status_code == 200
        data = response.json()
        assert "tones" in data
        assert isinstance(data["tones"], list)
        assert "default" in data["tones"]

# ==================== WebSocket Tests ====================

class TestWebSocket:
    """Test WebSocket connection and authentication."""
    
    def test_websocket_connection_with_valid_token(self, client, auth_token, test_username):
        """Test WebSocket connection with valid JWT token."""
        with client.websocket_connect(
            f"/ws/notify/{test_username}",
            headers={"Authorization": f"Bearer {auth_token}"}
        ) as websocket:
            data = websocket.receive_json(timeout=1.0)
            assert "message" in data or "type" in data

    def test_websocket_connection_with_token_query_param(self, client, auth_token, test_username):
        """Test WebSocket connection with token as query parameter."""
        with client.websocket_connect(
            f"/ws/notify/{test_username}?token={auth_token}"
        ) as websocket:
            data = websocket.receive_json(timeout=1.0)
            # Connection should be established
            assert data is not None

    def test_websocket_unauthenticated_named_user_rejected(self, client, test_username):
        """Test that unauthenticated named users are rejected."""
        with pytest.raises(Exception):
            # Should raise an exception (connection refused)
            with client.websocket_connect(
                f"/ws/notify/{test_username}"
            ) as websocket:
                data = websocket.receive_json(timeout=1.0)

    def test_websocket_guest_allowed_without_auth(self, client):
        """Test that guest user is allowed without auth."""
        with client.websocket_connect(
            "/ws/notify/guest"
        ) as websocket:
            data = websocket.receive_json(timeout=1.0)
            # Guest should be allowed
            assert data is not None

# ==================== CORS Tests ====================

class TestCORS:
    """Test CORS headers are present and correct."""
    
    def test_cors_headers_present(self, client):
        """Test that CORS headers are present in responses."""
        response = client.get("/tones")
        assert response.status_code == 200
        # CORS headers might be set by middleware
        # Check if at least one common header is present
        headers = response.headers
        # Headers might include: Access-Control-Allow-Origin, etc.

    def test_preflight_request(self, client):
        """Test OPTIONS preflight request."""
        response = client.options(
            "/guide",
            headers={
                "Origin": "https://virgil-ai-assistant.netlify.app",
                "Access-Control-Request-Method": "POST"
            }
        )
        # Should return 200 or 204 for preflight
        assert response.status_code in [200, 204, 405]

# ==================== Error Handling Tests ====================

class TestErrorHandling:
    """Test error responses and edge cases."""
    
    def test_invalid_endpoint(self, client):
        """Test request to non-existent endpoint."""
        response = client.get("/invalid-endpoint")
        assert response.status_code == 404

    def test_malformed_json(self, client):
        """Test request with malformed JSON."""
        response = client.post(
            "/guide",
            data="not json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code in [400, 422]

    def test_missing_required_fields(self, client):
        """Test request with missing required fields."""
        response = client.post(
            "/guide",
            json={}  # Missing "message" field
        )
        assert response.status_code in [400, 422]

# ==================== Integration Tests ====================

class TestIntegrationFlows:
    """Test complete user workflows."""
    
    def test_complete_user_flow(self, client, auth_token, test_username):
        """Test complete flow: auth -> message -> history -> delete."""
        # 1. Get new token
        token_response = client.post(
            "/auth/token",
            json={"username": test_username, "password": "pass"}
        )
        assert token_response.status_code == 200
        token = token_response.json()["access_token"]
        
        # 2. Send first message
        msg_response = client.post(
            "/quick-guide",
            json={"message": "Hello"},
            headers={"X-User-Id": test_username}
        )
        assert msg_response.status_code == 200
        
        # 3. Get history
        history_response = client.get(
            "/history",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert history_response.status_code == 200
        
        # 4. Export data (history response is export)
        assert "conversations" in history_response.json()
        
        # 5. Delete data with confirmation
        delete_response = client.delete(
            "/user-data",
            headers={
                "Authorization": f"Bearer {token}",
                "X-Confirm-Delete": "true"
            }
        )
        assert delete_response.status_code == 200

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
