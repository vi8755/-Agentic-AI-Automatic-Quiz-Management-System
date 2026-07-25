from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..models import User, UserRole,Teacher,Section
from ..security import require_role

from ..schemas import (
    TeacherCreate,
    TeacherRegistrationCreate,
    TeacherResponse,
    TeacherAssignmentsResponse,
    TeacherMySectionResponse,
    TeacherDashboardResponse,
    TeacherQuizResponse,
    TeacherQuizAssignmentResponse,
    UpdateQuizRequest,
    QuizWithQuestionsResponse,

)
from ..services.teacher_service import (
    create_teacher,
    register_teacher,
    get_teacher_assignments,
    get_my_sections,
    get_teacher_dashboard,
    get_teacher_quizzes,
    get_quiz_assignments,
    get_teacher_analytics,
    get_quiz_performance,
    get_section_performance,
    get_teacher_quiz_by_id,
    get_recent_quiz_activity,
    update_teacher_quiz,
    delete_teacher_quiz,
    duplicate_teacher_quiz,
    publish_teacher_quiz,
    move_quiz_to_draft,
)
 
router = APIRouter(
    prefix="/teachers",
    tags=["Teachers"],
)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


 
@router.get(
    "/{teacher_id}/assignments",
    response_model=TeacherAssignmentsResponse,
)
def get_teacher_assignments_api(
    teacher_id: int,
    db: Session = Depends(get_db),
):
    try:
        return get_teacher_assignments(db, teacher_id)

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )
    

@router.get(
    "/my-sections",
    response_model=list[TeacherMySectionResponse],
)
def my_sections(
    current_user: User = Depends(
        require_role(UserRole.TEACHER)
    ),
    db: Session = Depends(get_db),
):
    try:
        return get_my_sections(
            db,
            current_user,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )

@router.get(
    "/dashboard",
    response_model=TeacherDashboardResponse,
)
def teacher_dashboard(
    current_user: User = Depends(
        require_role(UserRole.TEACHER)
    ),
    db: Session = Depends(get_db),
):
    try:
        return get_teacher_dashboard(
            db,
            current_user,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )

@router.post(
    "/register",
    response_model=TeacherResponse,
)
def register_teacher_api(
    teacher: TeacherRegistrationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.DEAN)
    ),
):
    try:
        return register_teacher(db, teacher)

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

@router.get(
    "/quizzes",
    response_model=list[TeacherQuizResponse],
)
def teacher_quizzes(
    current_user: User = Depends(
        require_role(UserRole.TEACHER)
    ),
    db: Session = Depends(get_db),
):
    try:
        return get_teacher_quizzes(
            db,
            current_user,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )

@router.get(
    "/quizzes/{quiz_id}/assignments",
    response_model=list[TeacherQuizAssignmentResponse],
)
def teacher_quiz_assignments(
    quiz_id: int,
    current_user: User = Depends(
        require_role(UserRole.TEACHER)
    ),
    db: Session = Depends(get_db),
):
    try:
        return get_quiz_assignments(
            db,
            current_user,
            quiz_id,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )

@router.get("/analytics")
def teacher_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.TEACHER)
    ),
):
    teacher = (
        db.query(Teacher)
        .filter(Teacher.user_id == current_user.id)
        .first()
    )

    if not teacher:
        raise HTTPException(
            status_code=404,
            detail="Teacher profile not found."
        )

    return get_teacher_analytics(
        db,
        teacher.id,
    )

@router.get("/analytics/quiz-performance")
def teacher_quiz_performance(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.TEACHER)
    ),
):
    teacher = (
        db.query(Teacher)
        .filter(Teacher.user_id == current_user.id)
        .first()
    )

    if not teacher:
        raise HTTPException(
            status_code=404,
            detail="Teacher profile not found.",
        )

    return get_quiz_performance(
        db,
        teacher.id,
    )

@router.get("/analytics/section-performance")
def teacher_section_performance(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.TEACHER)
    ),
):
    teacher = (
        db.query(Teacher)
        .filter(
            Teacher.user_id == current_user.id
        )
        .first()
    )

    if not teacher:
        raise HTTPException(
            status_code=404,
            detail="Teacher profile not found.",
        )

    return get_section_performance(
        db,
        teacher.id,
    )

@router.get("/quizzes/{quiz_id}",response_model=QuizWithQuestionsResponse,)
def teacher_quiz_details(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.TEACHER)
    ),
):
    try:
        return get_teacher_quiz_by_id(
            db,
            current_user,
            quiz_id,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )

@router.get("/analytics/recent-quizzes")
def teacher_recent_quizzes(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.TEACHER)
    ),
):
    teacher = (
        db.query(Teacher)
        .filter(Teacher.user_id == current_user.id)
        .first()
    )

    if not teacher:
        raise HTTPException(
            status_code=404,
            detail="Teacher not found",
        )

    return get_recent_quiz_activity(
        db,
        teacher.id,
    )
@router.put("/quizzes/{quiz_id}")
def edit_teacher_quiz(
    quiz_id: int,
    quiz_data: UpdateQuizRequest,
    current_user: User = Depends(
        require_role(UserRole.TEACHER)
    ),
    db: Session = Depends(get_db),
):
    try:
        return update_teacher_quiz(
            db,
            current_user,
            quiz_id,
            quiz_data,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )

@router.delete("/quizzes/{quiz_id}")
def delete_quiz(
    quiz_id: int,
    current_user: User = Depends(
        require_role(UserRole.TEACHER)
    ),
    db: Session = Depends(get_db),
):
    try:
        return delete_teacher_quiz(
            db,
            current_user,
            quiz_id,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )

    except PermissionError as e:
        raise HTTPException(
            status_code=403,
            detail=str(e),
        )

@router.post("/quizzes/{quiz_id}/duplicate")
def duplicate_quiz(
    quiz_id: int,
    current_user: User = Depends(
        require_role(UserRole.TEACHER)
    ),
    db: Session = Depends(get_db),
):
    try:
        return duplicate_teacher_quiz(
            db,
            current_user,
            quiz_id,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )

    except PermissionError as e:
        raise HTTPException(
            status_code=403,
            detail=str(e),
        )

@router.patch("/quizzes/{quiz_id}/publish")
def publish_quiz(
    quiz_id: int,
    current_user: User = Depends(
        require_role(UserRole.TEACHER)
    ),
    db: Session = Depends(get_db),
):
    try:
        return publish_teacher_quiz(
            db,
            current_user,
            quiz_id,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )

    except PermissionError as e:
        raise HTTPException(
            status_code=403,
            detail=str(e),
        )

@router.patch("/quizzes/{quiz_id}/draft")
def draft_quiz(
    quiz_id: int,
    current_user: User = Depends(
        require_role(UserRole.TEACHER)
    ),
    db: Session = Depends(get_db),
):
    try:
        return move_quiz_to_draft(
            db,
            current_user,
            quiz_id,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )

    except PermissionError as e:
        raise HTTPException(
            status_code=403,
            detail=str(e),
        )


    