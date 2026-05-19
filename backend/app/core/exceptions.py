# backend/app/core/exceptions.py
from fastapi import HTTPException, status


class AppException(Exception):
    status_code: int = 500
    detail: str = "Internal server error"

    def __init__(self, detail: str | None = None) -> None:
        self.detail = detail or self.__class__.detail
        super().__init__(self.detail)

    def to_http(self) -> HTTPException:
        return HTTPException(status_code=self.status_code, detail=self.detail)


class AuthenticationError(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    detail = "Authentication failed"


class AuthorizationError(AppException):
    status_code = status.HTTP_403_FORBIDDEN
    detail = "Not authorized"


class NotFoundError(AppException):
    status_code = status.HTTP_404_NOT_FOUND
    detail = "Resource not found"


class ConflictError(AppException):
    status_code = status.HTTP_409_CONFLICT
    detail = "Resource conflict"


class ValidationError(AppException):
    status_code = status.HTTP_422_UNPROCESSABLE_CONTENT
    detail = "Validation error"
