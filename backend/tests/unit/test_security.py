# backend/tests/unit/test_security.py
import pytest

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    hash_password,
    verify_password,
)


def test_hash_and_verify_password():
    hashed = hash_password("mysecret")
    assert verify_password("mysecret", hashed) is True
    assert verify_password("wrong", hashed) is False


def test_create_and_decode_access_token():
    token = create_access_token(subject="user-123")
    payload = decode_access_token(token)
    assert payload["sub"] == "user-123"


def test_decode_invalid_token_raises():
    with pytest.raises(ValueError, match="Invalid token"):
        decode_access_token("not.a.valid.token")


def test_refresh_token_rejected_by_decode_access_token():
    refresh = create_refresh_token(subject="user-123")
    with pytest.raises(ValueError, match="Invalid token"):
        decode_access_token(refresh)


def test_access_token_rejected_by_decode_refresh_token():
    access = create_access_token(subject="user-123")
    with pytest.raises(ValueError, match="Invalid token"):
        decode_refresh_token(access)


def test_create_refresh_token_roundtrip():
    token = create_refresh_token(subject="user-456")
    payload = decode_refresh_token(token)
    assert payload["sub"] == "user-456"
    assert payload["type"] == "refresh"
