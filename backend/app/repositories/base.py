# backend/app/repositories/base.py
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base


class BaseRepository[ModelT: Base]:
    model: type[ModelT]

    def __init_subclass__(cls, **kwargs: object) -> None:
        super().__init_subclass__(**kwargs)
        if "model" not in cls.__dict__:
            raise TypeError(f"{cls.__name__} must define a 'model' class attribute")

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, record_id: str) -> ModelT | None:
        return await self._session.get(self.model, record_id)

    async def save(self, instance: ModelT) -> ModelT:
        self._session.add(instance)
        await self._session.flush()
        await self._session.refresh(instance)
        return instance

    async def delete(self, instance: ModelT) -> None:
        await self._session.delete(instance)
        await self._session.flush()

    async def list_all(self, limit: int = 100, offset: int = 0) -> list[ModelT]:
        result = await self._session.execute(
            select(self.model).offset(offset).limit(limit)
        )
        return list(result.scalars().all())
