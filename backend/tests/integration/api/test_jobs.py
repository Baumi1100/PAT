# backend/tests/integration/api/test_jobs.py


async def _auth_header(client) -> dict:
    await client.post(
        "/api/v1/auth/register",
        json={"email": "job@test.com", "password": "pass123", "full_name": "Job Tester"},
    )
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "job@test.com", "password": "pass123"},
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


async def test_create_job(client):
    headers = await _auth_header(client)
    resp = await client.post(
        "/api/v1/jobs/",
        json={"title": "Senior Python Dev", "company": "Acme", "source": "telegram"},
        headers=headers,
    )
    assert resp.status_code == 201
    job = resp.json()
    assert job["title"] == "Senior Python Dev"
    assert job["company"] == "Acme"
    assert job["status"] == "interessant"
    assert job["source"] == "telegram"


async def test_list_jobs(client):
    headers = await _auth_header(client)
    await client.post(
        "/api/v1/jobs/",
        json={"title": "Backend Engineer"},
        headers=headers,
    )
    resp = await client.get("/api/v1/jobs/", headers=headers)
    assert resp.status_code == 200
    jobs = resp.json()
    assert len(jobs) == 1
    assert jobs[0]["title"] == "Backend Engineer"


async def test_get_job(client):
    headers = await _auth_header(client)
    create_resp = await client.post(
        "/api/v1/jobs/",
        json={"title": "DevOps Engineer"},
        headers=headers,
    )
    job_id = create_resp.json()["id"]
    resp = await client.get(f"/api/v1/jobs/{job_id}", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == job_id


async def test_delete_job(client):
    headers = await _auth_header(client)
    create_resp = await client.post(
        "/api/v1/jobs/",
        json={"title": "To Be Deleted"},
        headers=headers,
    )
    job_id = create_resp.json()["id"]
    resp = await client.delete(f"/api/v1/jobs/{job_id}", headers=headers)
    assert resp.status_code == 204
    resp = await client.get(f"/api/v1/jobs/{job_id}", headers=headers)
    assert resp.status_code == 404


async def test_get_job_not_found(client):
    headers = await _auth_header(client)
    resp = await client.get("/api/v1/jobs/nonexistent-id", headers=headers)
    assert resp.status_code == 404


async def test_create_job_unauthenticated(client):
    resp = await client.post(
        "/api/v1/jobs/",
        json={"title": "Test"},
    )
    assert resp.status_code == 401
