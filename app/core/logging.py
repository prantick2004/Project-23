"""
app/core/logging.py
-------------------
Structured logging configuration for Project-23 using structlog.
All logs are output as clean, readable format in development
and as JSON in production for easy searching.
"""

import logging
import sys
import structlog
from app.core.config import get_settings

settings = get_settings()


def setup_logging() -> None:
    """
    Configure structlog for the entire application.
    Call this once at application startup in main.py.
    """

    # Set log level based on debug mode
    log_level = logging.DEBUG if settings.debug else logging.INFO

    # Configure standard Python logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level,
    )

    # Processors applied to every log entry
    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
    ]

    if settings.debug:
        # Development: colored, human-readable output
        processors = shared_processors + [
            structlog.dev.ConsoleRenderer(colors=True)
        ]
    else:
        # Production: JSON output for log aggregators
        processors = shared_processors + [
            structlog.processors.dict_tracebacks,
            structlog.processors.JSONRenderer(),
        ]

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(log_level),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str = "project23"):
    """
    Get a logger instance.
    Usage:
        from app.core.logging import get_logger
        logger = get_logger(__name__)
        logger.info("Employee registered", employee_id="123", name="Riya")
    """
    return structlog.get_logger(name)
