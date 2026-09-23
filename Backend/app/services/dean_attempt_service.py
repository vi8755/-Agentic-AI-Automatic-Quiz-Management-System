from collections import defaultdict

from sqlalchemy.orm import Session

from ..models import (
    Quiz,
    QuizAssignment,
    Response,
    Student,
    User,
    Section,
    Teacher,
)


def get_dean_attempt_analytics(
    db: Session,
    section_id: int | None = None,
    teacher_id: int | None = None,
):
    """
    Dean Attempts / Performance Analytics

    Uses:
        QuizAssignment -> assignment/student/section
        Response      -> attempt/score
        Question      -> actual quiz total marks

    Percentage is ALWAYS calculated using the actual
    total marks of the quiz.
    """

    # ============================================================
    # LOAD ASSIGNMENTS
    # ============================================================

    query = (
        db.query(QuizAssignment)
        .outerjoin(
            Quiz,
            QuizAssignment.quiz_id == Quiz.id,
        )
        .outerjoin(
            Section,
            QuizAssignment.section_id == Section.id,
        )
        .outerjoin(
            Student,
            QuizAssignment.student_id == Student.id,
        )
        .outerjoin(
            User,
            Student.user_id == User.id,
        )
        .outerjoin(
            Teacher,
            Quiz.teacher_id == Teacher.id,
        )
    )

    if section_id is not None:
        query = query.filter(
            QuizAssignment.section_id == section_id
        )

    if teacher_id is not None:
        query = query.filter(
            Quiz.teacher_id == teacher_id
        )

    assignments = query.all()

    # ============================================================
    # EMPTY RESULT
    # ============================================================

    if not assignments:
        return {
            "summary": {
                "total_assignments": 0,
                "total_attempts": 0,
                "attempt_rate": 0,
                "average_score": 0,
                "average_percentage": 0,
                "highest_score": 0,
                "highest_percentage": 0,
            },
            "sections": [],
            "quizzes": [],
            "students": [],
        }

    # ============================================================
    # QUIZ IDS
    # ============================================================

    quiz_ids = list(
        {
            assignment.quiz_id
            for assignment in assignments
            if assignment.quiz_id is not None
        }
    )

    # ============================================================
    # STUDENT EMAILS
    # ============================================================

    student_emails = list(
        {
            assignment.student_email
            for assignment in assignments
            if assignment.student_email
        }
    )

    # ============================================================
    # LOAD RESPONSES
    # ============================================================

    responses = []

    if quiz_ids and student_emails:

        responses = (
            db.query(Response)
            .filter(
                Response.quiz_id.in_(quiz_ids),
                Response.student_email.in_(student_emails),
            )
            .order_by(
                Response.submitted_at.desc()
            )
            .all()
        )

    # ============================================================
    # LATEST RESPONSE
    #
    # quiz_id + student_email
    # ============================================================

    response_map = {}

    for response in responses:

        key = (
            response.quiz_id,
            response.student_email,
        )

        if key not in response_map:
            response_map[key] = response

    # ============================================================
    # LOAD STUDENTS BY EMAIL
    # ============================================================

    student_by_email = {}

    if student_emails:

        student_rows = (
            db.query(Student)
            .join(
                User,
                Student.user_id == User.id,
            )
            .filter(
                User.email.in_(student_emails)
            )
            .all()
        )

        for student in student_rows:

            if student.user:

                student_by_email[
                    student.user.email
                ] = student

    # ============================================================
    # LOAD STUDENTS BY ID
    # ============================================================

    student_ids = list(
        {
            assignment.student_id
            for assignment in assignments
            if assignment.student_id is not None
        }
    )

    student_by_id = {}

    if student_ids:

        student_rows = (
            db.query(Student)
            .join(
                User,
                Student.user_id == User.id,
            )
            .filter(
                Student.id.in_(student_ids)
            )
            .all()
        )

        for student in student_rows:

            student_by_id[
                student.id
            ] = student

    # ============================================================
    # LOAD QUIZZES
    #
    # IMPORTANT:
    # Total marks are calculated from Question.marks
    # ============================================================

    quiz_by_id = {}

    if quiz_ids:

        quiz_rows = (
            db.query(Quiz)
            .filter(
                Quiz.id.in_(quiz_ids)
            )
            .all()
        )

        for quiz in quiz_rows:
            quiz_by_id[
                quiz.id
            ] = quiz

    # ============================================================
    # CALCULATE ACTUAL TOTAL MARKS FOR EACH QUIZ
    # ============================================================

    quiz_total_marks = {}

    for quiz_id, quiz in quiz_by_id.items():

        total_marks = 0

        if quiz.questions_relation:

            for question in quiz.questions_relation:

                total_marks += (
                    question.marks
                    if question.marks is not None
                    else 1
                )

        quiz_total_marks[
            quiz_id
        ] = total_marks

    # ============================================================
    # BASIC DATA
    # ============================================================

    total_assignments = len(assignments)

    total_attempts = 0

    # ============================================================
    # SECTION DATA
    # ============================================================

    section_data = defaultdict(
        lambda: {
            "section_id": None,
            "section_name": "Unknown",
            "department": None,
            "total_assignments": 0,
            "total_attempts": 0,
            "scores": [],
            "percentages": [],
            "students": {},
        }
    )

    # ============================================================
    # QUIZ DATA
    # ============================================================

    quiz_data = {}

    # ============================================================
    # STUDENT DATA
    # ============================================================

    student_data = {}

    # ============================================================
    # PROCESS ASSIGNMENTS
    # ============================================================

    for assignment in assignments:

        # --------------------------------------------------------
        # QUIZ
        # --------------------------------------------------------

        quiz = quiz_by_id.get(
            assignment.quiz_id
        )

        # --------------------------------------------------------
        # SECTION
        # --------------------------------------------------------

        section = assignment.section

        if (
            section is None
            and assignment.section_id is not None
        ):

            section = (
                db.query(Section)
                .filter(
                    Section.id
                    == assignment.section_id
                )
                .first()
            )

        # --------------------------------------------------------
        # STUDENT
        # --------------------------------------------------------

        student = None

        if assignment.student_id is not None:

            student = student_by_id.get(
                assignment.student_id
            )

        if (
            student is None
            and assignment.student_email
        ):

            student = student_by_email.get(
                assignment.student_email
            )

        # --------------------------------------------------------
        # STUDENT EMAIL
        #
        # Prefer actual student's user email.
        # --------------------------------------------------------

        actual_student_email = (
            student.user.email
            if student
            and student.user
            else assignment.student_email
        )

        # --------------------------------------------------------
        # RESPONSE
        # --------------------------------------------------------

        response = None

        if (
            assignment.quiz_id is not None
            and actual_student_email
        ):

            response = response_map.get(
                (
                    assignment.quiz_id,
                    actual_student_email,
                )
            )

        attempted = response is not None

        score = None
        percentage = None

        if attempted:

            score = (
                response.score
                if response.score is not None
                else 0
            )

            total_marks = quiz_total_marks.get(
                assignment.quiz_id,
                0,
            )

            if total_marks > 0:

                percentage = round(
                    (
                        score
                        / total_marks
                    )
                    * 100,
                    2,
                )

        # --------------------------------------------------------
        # SECTION
        # --------------------------------------------------------

        current_section_id = (
            assignment.section_id
        )

        section_key = (
            current_section_id
            if current_section_id is not None
            else 0
        )

        section_entry = section_data[
            section_key
        ]

        section_entry["section_id"] = (
            current_section_id
        )

        section_entry["section_name"] = (
            section.section_name
            if section
            else "Unknown"
        )

        section_entry["department"] = (
            section.department
            if section
            else None
        )

        section_entry[
            "total_assignments"
        ] += 1

        # --------------------------------------------------------
        # SECTION ATTEMPT
        # --------------------------------------------------------

        if attempted:

            section_entry[
                "total_attempts"
            ] += 1

            if score is not None:

                section_entry[
                    "scores"
                ].append(score)

            if percentage is not None:

                section_entry[
                    "percentages"
                ].append(percentage)

            total_attempts += 1

        # --------------------------------------------------------
        # STUDENT KEY
        # --------------------------------------------------------

        student_key = (
            assignment.student_id
            if assignment.student_id is not None
            else actual_student_email
        )

        # --------------------------------------------------------
        # STUDENT DISPLAY DATA
        # --------------------------------------------------------

        if student is not None:

            student_name = (
                student.user.name
                if student.user
                else "Unknown"
            )

            student_email = (
                student.user.email
                if student.user
                else actual_student_email
            )

            roll_no = student.roll_no

        else:

            student_name = "Unknown"

            student_email = (
                actual_student_email
            )

            roll_no = None

        # --------------------------------------------------------
        # SECTION STUDENT
        # --------------------------------------------------------

        if student_key not in section_entry[
            "students"
        ]:

            section_entry[
                "students"
            ][student_key] = {

                "student_id":
                    assignment.student_id,

                "student_name":
                    student_name,

                "email":
                    student_email,

                "roll_no":
                    roll_no,

                "attempts":
                    0,

                "scores":
                    [],

                "percentages":
                    [],
            }

        section_student = (
            section_entry[
                "students"
            ][student_key]
        )

        if attempted:

            section_student[
                "attempts"
            ] += 1

            if score is not None:

                section_student[
                    "scores"
                ].append(score)

            if percentage is not None:

                section_student[
                    "percentages"
                ].append(percentage)

        # --------------------------------------------------------
        # GLOBAL STUDENT DATA
        # --------------------------------------------------------

        if student_key not in student_data:

            student_data[
                student_key
            ] = {

                "student_id":
                    assignment.student_id,

                "student_name":
                    student_name,

                "email":
                    student_email,

                "roll_no":
                    roll_no,

                "section_id":
                    assignment.section_id,

                "section_name":
                    (
                        section.section_name
                        if section
                        else "Unknown"
                    ),

                "attempts":
                    0,

                "scores":
                    [],

                "percentages":
                    [],
            }

        global_student = student_data[
            student_key
        ]

        if attempted:

            global_student[
                "attempts"
            ] += 1

            if score is not None:

                global_student[
                    "scores"
                ].append(score)

            if percentage is not None:

                global_student[
                    "percentages"
                ].append(percentage)

        # ========================================================
        # QUIZ ANALYTICS
        # ========================================================

        quiz_key = assignment.quiz_id

        if quiz_key not in quiz_data:

            teacher = (
                quiz.teacher
                if quiz
                else None
            )

            teacher_name = None

            if (
                teacher
                and teacher.user
            ):

                teacher_name = (
                    teacher.user.name
                )

            quiz_data[
                quiz_key
            ] = {

                "quiz_id":
                    assignment.quiz_id,

                "title":
                    (
                        quiz.title
                        if quiz
                        else "Unknown Quiz"
                    ),

                "teacher_id":
                    (
                        quiz.teacher_id
                        if quiz
                        else None
                    ),

                "teacher_name":
                    teacher_name,

                "section_id":
                    assignment.section_id,

                "section_name":
                    (
                        section.section_name
                        if section
                        else "Unknown"
                    ),

                "subject_id":
                    (
                        quiz.subject_id
                        if quiz
                        else None
                    ),

                "total_marks":
                    quiz_total_marks.get(
                        quiz_key,
                        0,
                    ),

                "total_assignments":
                    0,

                "total_attempts":
                    0,

                "scores":
                    [],

                "percentages":
                    [],
            }

        quiz_entry = quiz_data[
            quiz_key
        ]

        quiz_entry[
            "total_assignments"
        ] += 1

        if attempted:

            quiz_entry[
                "total_attempts"
            ] += 1

            if score is not None:

                quiz_entry[
                    "scores"
                ].append(score)

            if percentage is not None:

                quiz_entry[
                    "percentages"
                ].append(percentage)

    # ============================================================
    # STATISTICS HELPER
    # ============================================================

    def calculate_stats(
        assignments_count,
        attempts_count,
        scores,
        percentages,
    ):

        average_score = (
            round(
                sum(scores)
                / len(scores),
                2,
            )
            if scores
            else 0
        )

        average_percentage = (
            round(
                sum(percentages)
                / len(percentages),
                2,
            )
            if percentages
            else 0
        )

        highest_score = (
            max(scores)
            if scores
            else 0
        )

        highest_percentage = (
            max(percentages)
            if percentages
            else 0
        )

        attempt_rate = (
            round(
                (
                    attempts_count
                    / assignments_count
                )
                * 100,
                2,
            )
            if assignments_count
            else 0
        )

        return {
            "total_assignments":
                assignments_count,

            "total_attempts":
                attempts_count,

            "attempt_rate":
                attempt_rate,

            "average_score":
                average_score,

            "average_percentage":
                average_percentage,

            "highest_score":
                highest_score,

            "highest_percentage":
                highest_percentage,
        }

    # ============================================================
    # SECTION RESULTS
    # ============================================================

    sections_result = []

    for section_entry in section_data.values():

        students_result = []

        for student in section_entry[
            "students"
        ].values():

            scores = student[
                "scores"
            ]

            percentages = student[
                "percentages"
            ]

            average_score = (
                round(
                    sum(scores)
                    / len(scores),
                    2,
                )
                if scores
                else 0
            )

            average_percentage = (
                round(
                    sum(percentages)
                    / len(percentages),
                    2,
                )
                if percentages
                else 0
            )

            highest_score = (
                max(scores)
                if scores
                else 0
            )

            highest_percentage = (
                max(percentages)
                if percentages
                else 0
            )

            students_result.append(
                {
                    "student_id":
                        student["student_id"],

                    "student_name":
                        student["student_name"],

                    "email":
                        student["email"],

                    "roll_no":
                        student["roll_no"],

                    "attempts":
                        student["attempts"],

                    "average_score":
                        average_score,

                    "average_percentage":
                        average_percentage,

                    "highest_score":
                        highest_score,

                    "highest_percentage":
                        highest_percentage,
                }
            )

        # --------------------------------------------------------
        # TOP 10
        # --------------------------------------------------------

        students_result.sort(
            key=lambda student: (
                student["average_percentage"],
                student["highest_percentage"],
                student["attempts"],
            ),
            reverse=True,
        )

        top_performers = (
            students_result[:10]
        )

        # --------------------------------------------------------
        # SECTION STATS
        # --------------------------------------------------------

        stats = calculate_stats(
            section_entry[
                "total_assignments"
            ],
            section_entry[
                "total_attempts"
            ],
            section_entry[
                "scores"
            ],
            section_entry[
                "percentages"
            ],
        )

        sections_result.append(
            {
                "section_id":
                    section_entry[
                        "section_id"
                    ],

                "section_name":
                    section_entry[
                        "section_name"
                    ],

                "department":
                    section_entry[
                        "department"
                    ],

                **stats,

                "top_performers":
                    top_performers,
            }
        )

    # ============================================================
    # SORT SECTIONS
    # ============================================================

    sections_result.sort(
        key=lambda section: (
            section["section_name"]
            or ""
        )
    )

    # ============================================================
    # QUIZ RESULTS
    # ============================================================

    quizzes_result = []

    for quiz_entry in quiz_data.values():

        stats = calculate_stats(
            quiz_entry[
                "total_assignments"
            ],
            quiz_entry[
                "total_attempts"
            ],
            quiz_entry[
                "scores"
            ],
            quiz_entry[
                "percentages"
            ],
        )

        quizzes_result.append(
            {
                "quiz_id":
                    quiz_entry[
                        "quiz_id"
                    ],

                "title":
                    quiz_entry[
                        "title"
                    ],

                "teacher_id":
                    quiz_entry[
                        "teacher_id"
                    ],

                "teacher_name":
                    quiz_entry[
                        "teacher_name"
                    ],

                "section_id":
                    quiz_entry[
                        "section_id"
                    ],

                "section_name":
                    quiz_entry[
                        "section_name"
                    ],

                "subject_id":
                    quiz_entry[
                        "subject_id"
                    ],

                "total_marks":
                    quiz_entry[
                        "total_marks"
                    ],

                **stats,
            }
        )

    # ============================================================
    # SORT QUIZZES
    # ============================================================

    quizzes_result.sort(
        key=lambda quiz: (
            quiz["title"]
            or ""
        )
    )

    # ============================================================
    # STUDENT RESULTS
    # ============================================================

    students_result = []

    for student in student_data.values():

        scores = student[
            "scores"
        ]

        percentages = student[
            "percentages"
        ]

        average_score = (
            round(
                sum(scores)
                / len(scores),
                2,
            )
            if scores
            else 0
        )

        average_percentage = (
            round(
                sum(percentages)
                / len(percentages),
                2,
            )
            if percentages
            else 0
        )

        highest_score = (
            max(scores)
            if scores
            else 0
        )

        highest_percentage = (
            max(percentages)
            if percentages
            else 0
        )

        students_result.append(
            {
                "student_id":
                    student["student_id"],

                "student_name":
                    student["student_name"],

                "email":
                    student["email"],

                "roll_no":
                    student["roll_no"],

                "section_id":
                    student["section_id"],

                "section_name":
                    student["section_name"],

                "attempts":
                    student["attempts"],

                "average_score":
                    average_score,

                "average_percentage":
                    average_percentage,

                "highest_score":
                    highest_score,

                "highest_percentage":
                    highest_percentage,
            }
        )

    # ============================================================
    # SORT STUDENTS
    # ============================================================

    students_result.sort(
        key=lambda student: (
            student["average_percentage"],
            student["highest_percentage"],
            student["attempts"],
        ),
        reverse=True,
    )

    # ============================================================
    # OVERALL SUMMARY
    # ============================================================

    all_scores = []
    all_percentages = []

    for student in student_data.values():

        all_scores.extend(
            student["scores"]
        )

        all_percentages.extend(
            student["percentages"]
        )

    summary = calculate_stats(
        total_assignments,
        total_attempts,
        all_scores,
        all_percentages,
    )

    # ============================================================
    # FINAL RESPONSE
    # ============================================================

    return {
        "summary":
            summary,

        "sections":
            sections_result,

        "quizzes":
            quizzes_result,

        "students":
            students_result,
    }