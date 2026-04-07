from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://dual_user:dual_pass@dual_db:5432/dual_db"
    core_api_url: str = "http://core:8000"
    secret_key: str = "changeme-super-secret-key-for-jwt"
    algorithm: str = "HS256"

    class Config:
        env_file = ".env"


settings = Settings()
