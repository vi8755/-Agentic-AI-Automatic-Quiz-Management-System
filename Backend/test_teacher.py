from app.database import SessionLocal
from app.schemas import TeacherCreate
from app.services.teacher_service import create_teacher

db = SessionLocal()

teacher = TeacherCreate(
    user_id=1,   # Change if your user id is different
    employee_id="EMP001",
    department="CSE",
    designation="Assistant Professor",
    phone="9876543210"
)

try:
    result = create_teacher(db, teacher)
    print(result.id)
    print(result.employee_id)

except Exception as e:
    print(e)

finally:
    db.close()