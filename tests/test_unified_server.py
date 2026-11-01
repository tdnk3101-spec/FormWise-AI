import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from fastapi.testclient import TestClient
from app.main import app

def test_unified_server():
    client = TestClient(app)

    # 1. Test root / returns index.html
    r_root = client.get("/")
    print("GET / status:", r_root.status_code)
    assert r_root.status_code == 200
    assert "<!doctype html>" in r_root.text.lower() or "<html" in r_root.text.lower()

    # 2. Test SPA route /login returns index.html
    r_login = client.get("/login")
    print("GET /login status:", r_login.status_code)
    assert r_login.status_code == 200
    assert "<!doctype html>" in r_login.text.lower() or "<html" in r_login.text.lower()

    # 3. Test SPA route /vault returns index.html
    r_vault = client.get("/vault")
    print("GET /vault status:", r_vault.status_code)
    assert r_vault.status_code == 200

    # 4. Test API health check
    r_health = client.get("/api/v1/health")
    print("GET /api/v1/health status:", r_health.status_code, r_health.json())
    assert r_health.status_code == 200
    assert r_health.json()["status"] == "healthy"

    print("SUCCESS: All unified server tests passed!")

if __name__ == "__main__":
    test_unified_server()
