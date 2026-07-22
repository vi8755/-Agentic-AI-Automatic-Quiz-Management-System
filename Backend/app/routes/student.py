from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session

from ..database import SessionLocal

from ..models import (
    User,
    UserRole,
)
from ..security import get_current_user, require_role
from ..models import User, UserRole
from ..services.student_service import get_current_student

from ..schemas import (
    StudentRegistrationCreate,
    StudentResponse,
)

from ..security import require_role

from ..services.student_service import (
    register_student,
    get_all_students,
    get_student_by_id,
)

router = APIRouter(
    prefix="/students",
    tags=["Students"],
)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

 


@router.post(
    "/register",
    response_model=StudentResponse,
)
def register_student_api(
    student: StudentRegistrationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.DEAN)
    ),
):
    try:
        return register_student(db, student)

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )
    

@router.get(
    "/",
    response_model=list[StudentResponse],
)
def get_students_api(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.DEAN)
    ),
):
    return get_all_students(db)

@router.get(
    "/me",
    response_model=StudentResponse,
    dependencies=[Depends(require_role(UserRole.STUDENT))]
)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_current_student(current_user.id, db)

@router.get(
    "/{student_id}",
    response_model=StudentResponse,
)
def get_student_api(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.DEAN)
    ),
):
    try:
        return get_student_by_id(
            db,
            student_id,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )
    


