from app.database import SessionLocal
from app.models import User

db = SessionLocal()

try:
    users = db.query(User).all()

    for user in users:
        print(
            user.id,
            user.name,
            user.email,
            user.role,
        )

except Exception as e:
    print(e)

finally:
    db.close()