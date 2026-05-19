# backend/tests/integration/api/test_auth.py
import pytest


@pytest.mark.asyncio
async def test_register_and_login(client):
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "secret123", "full_name": "Test User"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "test@example.com"

    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "secret123"},
    )
    assert resp.status_code == 200
    tokens = resp.json()
    assert "access_token" in tokens


@pytest.mark.asyncio
async def test_get_me_requires_auth(client):
    resp = await client.get("/api/v1/users/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_me_with_valid_token(client):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "me@example.com", "password": "password", "full_name": "Me"},
    )
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "me@example.com", "password": "password"},
    )
    token = login_resp.json()["access_token"]
    resp = await client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "me@example.com"
