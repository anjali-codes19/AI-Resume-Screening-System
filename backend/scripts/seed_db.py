from __future__ import annotations

from app.db.base import Base
from app.db.seed import seed_default_dataset
from app.db.session import SessionLocal, engine


def main() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        seed_default_dataset(session)
    print("Seed data loaded.")


if __name__ == "__main__":
    main()
