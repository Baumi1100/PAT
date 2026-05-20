# backend/app/matching/embedding_service.py
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams
from openai import AsyncOpenAI

COLLECTION_RESUMES = "resumes"
COLLECTION_JOBS = "jobs"
EMBEDDING_MODEL = "text-embedding-3-small"
VECTOR_SIZE = 1536


async def get_qdrant() -> AsyncQdrantClient:
    from app.config import get_settings
    s = get_settings()
    return AsyncQdrantClient(host=s.qdrant_host, port=s.qdrant_port)


async def ensure_collections(client: AsyncQdrantClient) -> None:
    for name in [COLLECTION_RESUMES, COLLECTION_JOBS]:
        existing = await client.get_collections()
        names = [c.name for c in existing.collections]
        if name not in names:
            await client.create_collection(
                collection_name=name,
                vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
            )


async def embed_text(text: str) -> list[float]:
    from app.config import get_settings
    s = get_settings()
    oai = AsyncOpenAI(api_key=s.openai_api_key)
    response = await oai.embeddings.create(input=text[:8000], model=EMBEDDING_MODEL)
    return response.data[0].embedding


async def upsert_resume_embedding(resume_id: str, text: str) -> None:
    vector = await embed_text(text)
    client = await get_qdrant()
    await ensure_collections(client)
    await client.upsert(
        collection_name=COLLECTION_RESUMES,
        points=[PointStruct(id=resume_id, vector=vector, payload={"resume_id": resume_id})],
    )


async def upsert_job_embedding(job_id: str, text: str) -> None:
    vector = await embed_text(text)
    client = await get_qdrant()
    await ensure_collections(client)
    await client.upsert(
        collection_name=COLLECTION_JOBS,
        points=[PointStruct(id=job_id, vector=vector, payload={"job_id": job_id})],
    )


async def compute_semantic_similarity(resume_id: str, job_id: str) -> float:
    """Returns cosine similarity 0.0–1.0 between resume and job embeddings."""
    client = await get_qdrant()
    resume_vec = (await client.retrieve(COLLECTION_RESUMES, ids=[resume_id]))[0].vector
    job_vec = (await client.retrieve(COLLECTION_JOBS, ids=[job_id]))[0].vector
    if not resume_vec or not job_vec:
        return 0.0
    dot = sum(a * b for a, b in zip(resume_vec, job_vec))
    mag_r = sum(x * x for x in resume_vec) ** 0.5
    mag_j = sum(x * x for x in job_vec) ** 0.5
    return dot / (mag_r * mag_j) if mag_r and mag_j else 0.0
