from __future__ import annotations

from datetime import UTC, datetime

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse


class ResourceConflictError(Exception):
    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


class ResourceNotFoundError(Exception):
    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


def _payload(message: str, code: str) -> dict[str, str]:
    return {
        "detail": message,
        "error_code": code,
        "timestamp": datetime.now(UTC).isoformat(),
    }


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(ResourceConflictError)
    async def handle_conflict(_: Request, exc: ResourceConflictError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content=_payload(exc.message, "resource_conflict"),
        )

    @app.exception_handler(ResourceNotFoundError)
    async def handle_not_found(_: Request, exc: ResourceNotFoundError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=_payload(exc.message, "resource_not_found"),
        )

    @app.exception_handler(HTTPException)
    async def handle_http(_: Request, exc: HTTPException) -> JSONResponse:
        detail = exc.detail if isinstance(exc.detail, str) else "Request failed"
        return JSONResponse(
            status_code=exc.status_code,
            content=_payload(detail, "http_error"),
        )

    @app.exception_handler(Exception)
    async def handle_generic(_: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=_payload(str(exc), "internal_server_error"),
        )
