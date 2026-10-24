import os
import importlib
import pytest

def test_missing_database_url_fails_safely(monkeypatch):
    """Verify that a missing DATABASE_URL raises RuntimeError without exposing details."""
    import app.config
    monkeypatch.setenv("DATABASE_URL", "")
    with pytest.raises(RuntimeError) as exc_info:
        importlib.reload(app.config)
    assert "DATABASE_URL environment variable is missing or empty" in str(exc_info.value)

def test_invalid_scheme_fails_without_leaking_credentials(monkeypatch):
    """Verify that an unsupported scheme raises an error without echoing credentials."""
    import app.config
    secret_pass = "super_classified_pass_xyz987"
    monkeypatch.setenv("DATABASE_URL", f"mysql://admin:{secret_pass}@localhost:3306/fdr_db")
    with pytest.raises(RuntimeError) as exc_info:
        importlib.reload(app.config)
    assert "Unsupported database scheme" in str(exc_info.value)
    assert secret_pass not in str(exc_info.value)

def test_missing_hostname_fails_safely(monkeypatch):
    """Verify that a URL without host fails safely."""
    import app.config
    monkeypatch.setenv("DATABASE_URL", "postgresql:///fdr_smartguard")
    with pytest.raises(RuntimeError) as exc_info:
        importlib.reload(app.config)
    assert "must specify a valid host/hostname" in str(exc_info.value)

def test_valid_database_url_loads_cleanly(monkeypatch):
    """Verify that restoring the valid environment DATABASE_URL reloads cleanly."""
    import app.config
    # Load actual .env
    from dotenv import dotenv_values
    from pathlib import Path
    env_path = Path(__file__).resolve().parent.parent / ".env"
    actual_url = dotenv_values(env_path).get("DATABASE_URL")
    if actual_url:
        monkeypatch.setenv("DATABASE_URL", actual_url)
    importlib.reload(app.config)
    assert app.config.PORT == 8001
    assert app.config.DATABASE_URL.startswith("postgresql")
