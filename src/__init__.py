"""Package initializer for the application package.

Making `src` an explicit package helps some tools and import systems
when referencing `src.app:app` for uvicorn or tests.
"""

__all__ = ["app"]
