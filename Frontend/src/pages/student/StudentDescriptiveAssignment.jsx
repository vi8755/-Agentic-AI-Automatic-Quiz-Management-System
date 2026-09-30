import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import {
    ArrowLeft,
    CalendarDays,
    CheckCircle,
    ClipboardList,
    FileText,
    Loader2,
    Send,
    AlertCircle,
} from "lucide-react";

import {
    getStudentDescriptiveAssignment,
    getStudentDescriptiveAssignmentByToken,
    startStudentDescriptiveAssignment,
    submitStudentDescriptiveAssignment,

} from "../../api/studentApi";

import AnswerDrawingPad from "./AnswerDrawingPad";

const StudentDescriptiveAssignment = () => {
    const { assignmentId, token } = useParams();
    const navigate = useNavigate();

    // =========================================================
    // STATE
    // =========================================================

    const [assignment, setAssignment] = useState(null);

    const [answers, setAnswers] = useState({});

    const [drawings, setDrawings] = useState({});

    const [loading, setLoading] = useState(true);

    const [submitting, setSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);
    const [timeUntilStart, setTimeUntilStart] = useState(null);
    const [timeExpired, setTimeExpired] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const autoSubmittedRef = useRef(false);
    const submitStartedRef = useRef(false);
    const answersRef = useRef({});
    const drawingsRef = useRef({});
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
const [showTabWarning, setShowTabWarning] = useState(false);
const [isFullscreen, setIsFullscreen] = useState(false);
const [fullscreenViolationCount, setFullscreenViolationCount] =
    useState(0);
const [showFullscreenWarning, setShowFullscreenWarning] =
    useState(false);

    const [securityViolationCount, setSecurityViolationCount] = useState(0);
    const [showSecurityWarning, setShowSecurityWarning] = useState(false);
    const securityViolationCountRef = useRef(0);
    const startExamInProgressRef = useRef(false);

    const [error, setError] = useState("");
    const [examStarted, setExamStarted] = useState(false);

    // =========================================================
    // QUESTION ID HELPER
    // =========================================================

    const getQuestionId = (question) => {
        return (
            question?.question_id ??
            question?.question?.id ??
            question?.id ??
            null
        );
    };

    // =========================================================
    // LOAD ASSIGNMENT
    // =========================================================

    useEffect(() => {
        loadAssignment();
    }, [assignmentId, token]);

    const loadAssignment = async () => {
        try {
            setLoading(true);
            setError("");

            let data;

            /*
             * ----------------------------------------------------
             * DETECT HOW STUDENT OPENED THE ASSIGNMENT
             * ----------------------------------------------------
             *
             * Case 1:
             * /student/descriptive-assignments/token/ABC123
             *
             * Case 2:
             * /student/descriptive-assignments/ABC123
             *
             * Case 3:
             * /student/descriptive-assignments/5
             */

            let tokenValue = token || null;
            let assignmentIdValue = assignmentId || null;

            // If assignmentId is actually a token
            if (
                !tokenValue &&
                assignmentIdValue &&
                !/^\d+$/.test(String(assignmentIdValue))
            ) {
                tokenValue = assignmentIdValue;
                assignmentIdValue = null;
            }

            // ----------------------------------------------------
            // OPEN USING TOKEN
            // ----------------------------------------------------

            if (tokenValue) {
                console.log(
                    "Opening descriptive assignment using token:",
                    tokenValue
                );

                data =
                    await getStudentDescriptiveAssignmentByToken(
                        tokenValue
                    );
            }

            // ----------------------------------------------------
            // OPEN USING NUMERIC ASSIGNMENT ID
            // ----------------------------------------------------

            else if (
                assignmentIdValue &&
                /^\d+$/.test(String(assignmentIdValue))
            ) {
                console.log(
                    "Opening descriptive assignment using ID:",
                    assignmentIdValue
                );

                data =
                    await getStudentDescriptiveAssignment(
                        Number(assignmentIdValue)
                    );
            }

            // ----------------------------------------------------
            // INVALID LINK
            // ----------------------------------------------------

            else {
                setError("Invalid assignment link.");
                return;
            }

            console.log(
                "STUDENT DESCRIPTIVE ASSIGNMENT:",
                data
            );

            setAssignment(data);

            // ----------------------------------------------------
            // INITIAL ANSWERS
            // ----------------------------------------------------

            const initialAnswers = {};

            // ----------------------------------------------------
            // INITIAL DRAWINGS
            // ----------------------------------------------------

            const initialDrawings = {};

            (data?.questions || []).forEach((question) => {
                const questionId =
                    getQuestionId(question);

                if (questionId !== null) {
                    initialAnswers[questionId] = "";
                    initialDrawings[questionId] = null;
                }
            });

            answersRef.current = initialAnswers;
            drawingsRef.current = initialDrawings;

            setAnswers(initialAnswers);
            setDrawings(initialDrawings);

        } catch (err) {
            console.error(
                "Failed to load descriptive assignment:",
                err
            );

            const message =
                err?.response?.data?.detail ||
                "Failed to load assignment.";

            setError(message);

            toast.error(message);
        } finally {
            setLoading(false);
        }
    };
    // =========================================================
// PRE-START COUNTDOWN
// =========================================================

useEffect(() => {
    if (!assignment?.start_date_time || examStarted || submitted) {
        setTimeUntilStart(null);
        return;
    }

    const updateStartCountdown = () => {
        const startTime = new Date(
            assignment.start_date_time
        ).getTime();

        if (Number.isNaN(startTime)) {
            setTimeUntilStart(null);
            return;
        }

        const remainingSeconds = Math.max(
            0,
            Math.ceil((startTime - Date.now()) / 1000)
        );

        setTimeUntilStart(remainingSeconds);
    };

    updateStartCountdown();

    const timer = setInterval(
        updateStartCountdown,
        1000
    );

    return () => clearInterval(timer);
}, [
    assignment?.start_date_time,
    examStarted,
    submitted,
]);

// =========================================================
// EXAM TIMER
// =========================================================

useEffect(() => {
    if (
        !assignment?.expires_at ||
        !examStarted ||
        submitted
    ) {
        return;
    }

    const updateTimer = () => {
        const expiryTime = new Date(
            assignment.expires_at
        ).getTime();

        const currentTime = Date.now();

        const remainingSeconds = Math.max(
            0,
            Math.floor(
                (expiryTime - currentTime) / 1000
            )
        );

        setTimeLeft(remainingSeconds);

    };

    updateTimer();

    const timer = setInterval(
        updateTimer,
        1000
    );

    return () => {
        clearInterval(timer);
    };
}, [
    assignment?.expires_at,
    examStarted,
    submitted,
]);


     useEffect(() => {
    if (!assignment || !examStarted || submitted || timeExpired) {
        return;
    }

    const handleVisibilityChange = () => {
        if (!document.hidden || autoSubmittedRef.current) {
            return;
        }

        setTabSwitchCount((previousCount) => {
            const newCount = previousCount + 1;
            setShowTabWarning(true);

            // First tab switch = warning only.
            // Second tab switch = immediate auto-submit.
            if (newCount >= 2 && !autoSubmittedRef.current) {
                autoSubmittedRef.current = true;
                toast.error(
                    "You switched tabs again. Your assignment will be submitted automatically."
                );
                handleSubmit(true, "tab");
            }

            return newCount;
        });
    };

    document.addEventListener(
        "visibilitychange",
        handleVisibilityChange
    );

    return () => {
        document.removeEventListener(
            "visibilitychange",
            handleVisibilityChange
        );
    };
}, [
    assignment,
    examStarted,
    submitted,
    timeExpired,
]);
    // =========================================================
    // QUESTIONS
    // =========================================================

    const questions = useMemo(() => {
        if (!Array.isArray(assignment?.questions)) {
            return [];
        }

        return [...assignment.questions].sort(
            (a, b) =>
                Number(a?.question_order || 0) -
                Number(b?.question_order || 0)
        );
    }, [assignment]);

    // =========================================================
    // TOTAL MARKS
    // =========================================================

    const totalMarks = useMemo(() => {
        return questions.reduce(
            (total, question) =>
                total +
                Number(
                    question?.max_marks ??
                    question?.marks ??
                    0
                ),
            0
        );
    }, [questions]);

    // =========================================================
    // ANSWER CHANGE
    // =========================================================

    const handleAnswerChange = (
        questionId,
        value
    ) => {
        if (
            questionId === null ||
            questionId === undefined
        ) {
            return;
        }

        setAnswers((previous) => {
            const next = {
                ...previous,
                [questionId]: value,
            };

            answersRef.current = next;
            return next;
        });
    };

    // =========================================================
    // DRAWING CHANGE
    // =========================================================

    const handleDrawingChange = (
        questionId,
        drawing
    ) => {
        if (
            questionId === null ||
            questionId === undefined
        ) {
            return;
        }

        setDrawings((previous) => {
            const next = {
                ...previous,
                [questionId]: drawing,
            };

            drawingsRef.current = next;
            return next;
        });
    };

    // =========================================================
    // CHECK WHETHER DRAWING EXISTS
    // =========================================================

    const hasDrawing = (drawing) => {
        if (!drawing) {
            return false;
        }

        if (typeof drawing === "string") {
            return drawing.trim().length > 0;
        }

        /*
         * In case AnswerDrawingPad returns an object.
         * We consider it present if it contains something.
         */

        if (typeof drawing === "object") {
            return Object.keys(drawing).length > 0;
        }

        return Boolean(drawing);
    };

    // =========================================================
    // UNANSWERED QUESTIONS
    // =========================================================

    const unansweredQuestions = useMemo(() => {
        return questions.filter((question) => {
            const questionId =
                getQuestionId(question);

            if (questionId === null) {
                return true;
            }

            const answer =
                answers[questionId] || "";

            const drawing =
                drawings[questionId];

            const hasText =
                typeof answer === "string"
                    ? answer.trim().length > 0
                    : Boolean(answer);

            const hasDraw =
                hasDrawing(drawing);

            /*
             * Question is considered answered if:
             *
             * 1. Text answer exists
             * OR
             * 2. Drawing exists
             */

            return !hasText && !hasDraw;
        });
    }, [questions, answers, drawings]);

    // =========================================================
    // SUBMIT ASSIGNMENT
    // =========================================================

     const handleSubmit = async (
        isAutoSubmit = false,
        autoSubmitReason = "time"
    ) => {

        if (submitting || submitted || submitStartedRef.current) {
            return;
        }

        if (isAutoSubmit) {
            submitStartedRef.current = true;
        }

        if (!assignment) {
            toast.error(
                "Assignment information is not available."
            );
            return;
        }

        // -----------------------------------------------------
        // AUTO SUBMISSION
        // -----------------------------------------------------

        if (isAutoSubmit) {
            const autoSubmitMessage =
                autoSubmitReason === "tab"
                    ? "Your assignment is being submitted because the exam tab was switched twice."
                    : autoSubmitReason === "fullscreen"
                        ? "Your assignment is being submitted because fullscreen mode was exited twice."
                        : autoSubmitReason === "security"
                            ? "Your assignment is being submitted because multiple security violations were detected."
                            : "Time is over. Your assignment is being submitted automatically.";

            toast.info(autoSubmitMessage);
        }

        // -----------------------------------------------------
        // Validate all questions ONLY for manual submission.
        //
        // When the timer expires, we must submit whatever the
        // student has written instead of blocking submission
        // because some questions are unanswered.
        // -----------------------------------------------------

        if (!isAutoSubmit && unansweredQuestions.length > 0) {
            toast.warning(
                `Please answer all questions before submitting. ${
                    unansweredQuestions.length
                } question${
                    unansweredQuestions.length > 1
                        ? "s are"
                        : " is"
                } unanswered.`
            );

            const firstUnanswered =
                unansweredQuestions[0];

            const firstQuestionId =
                getQuestionId(firstUnanswered);

            if (firstQuestionId !== null) {
                const element =
                    document.getElementById(
                        `question-${firstQuestionId}`
                    );

                if (element) {
                    element.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                    });
                }
            }

            return;
        }

        // -----------------------------------------------------
        // Confirmation ONLY for manual submission.
        //
        // Auto-submit must not wait for window.confirm().
        // -----------------------------------------------------

        if (!isAutoSubmit) {
            const confirmed = window.confirm(
                "Are you sure you want to submit this assignment? You may not be able to edit your answers after submission."
            );

            if (!confirmed) {
                return;
            }
        }

        try {
            setSubmitting(true);

            const finalAssignmentId =
                assignment?.assignment_id ??
                assignment?.id ??
                assignmentId;

            if (!finalAssignmentId) {
                toast.error(
                    "Assignment ID is missing."
                );
                return;
            }

            // -------------------------------------------------
            // Build answers
            // -------------------------------------------------

            const submissionAnswers =
                questions.map((question) => {
                    const questionId =
                        getQuestionId(question);

                    return {
                        question_id:
                            Number(questionId),

                        answer_text:
                            answersRef.current[
                                questionId
                            ]?.trim() || "",

                        drawing_data:
                            drawingsRef.current[
                                questionId
                            ] ?? null,
                    };
                });

            // -------------------------------------------------
            // BACKEND PAYLOAD
            // -------------------------------------------------

            const payload = {
                assignment_id:
                    Number(finalAssignmentId),

                answers:
                    submissionAnswers,
            };

            console.log(
                "DESCRIPTIVE SUBMIT PAYLOAD:",
                payload
            );

            const response =
                await submitStudentDescriptiveAssignment(
                    payload
                );

            console.log(
                "DESCRIPTIVE SUBMISSION RESPONSE:",
                response
            );

            setSubmitted(true);

            if (!isAutoSubmit) {
                toast.success(
                    response?.message ||
                        "Assignment submitted successfully!"
                );
            }

            // -------------------------------------------------
            // GO TO RESULT PAGE
            // -------------------------------------------------

            navigate(
                `/student/descriptive-assignments/${finalAssignmentId}/status`,
                {
                    replace: true,
                }
            );

        } catch (err) {
            console.error(
                "Failed to submit descriptive assignment:",
                err
            );

            const message =
                err?.response?.data?.detail ||
                "Failed to submit assignment. Please try again.";

            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    // =========================================================
    // AUTO SUBMIT WHEN FIXED EXAM WINDOW REACHES ZERO
    // =========================================================

    useEffect(() => {
        if (
            !examStarted ||
            submitted ||
            timeLeft !== 0 ||
            autoSubmittedRef.current ||
            submitStartedRef.current
        ) {
            return;
        }

        console.log(
            "⏰ FIXED EXAM WINDOW REACHED 0 → AUTO SUBMIT"
        );

        autoSubmittedRef.current = true;
        setTimeExpired(true);

        handleSubmit(true, "time");
    }, [
        timeLeft,
        examStarted,
        submitted,
        handleSubmit,
    ]);

    // =========================================================
    // BROWSER SECURITY VIOLATION LOGGER
    // =========================================================

    const recordSecurityViolation = (reason) => {
        if (!examStarted || submitted || timeExpired) {
            return;
        }

        const nextCount = securityViolationCountRef.current + 1;
        securityViolationCountRef.current = nextCount;
        setSecurityViolationCount(nextCount);
        setShowSecurityWarning(true);

        const violation = {
            reason,
            count: nextCount,
            timestamp: new Date().toISOString(),
        };

        console.warn("DESCRIPTIVE EXAM SECURITY VIOLATION:", violation);

        try {
            const storageKey = `descriptive_exam_security_${
                assignment?.assignment_id ?? assignment?.id ?? assignmentId
            }`;

            const existing = JSON.parse(
                sessionStorage.getItem(storageKey) || "[]"
            );

            existing.push(violation);

            sessionStorage.setItem(
                storageKey,
                JSON.stringify(existing)
            );
        } catch (storageError) {
            console.warn(
                "Unable to store security violation locally:",
                storageError
            );
        }

        if (nextCount >= 2 && !autoSubmittedRef.current) {
            autoSubmittedRef.current = true;

            toast.error(
                "Multiple security violations detected. Your assignment will be submitted automatically."
            );

            handleSubmit(true, "security");
        } else {
            toast.warning(
                `Security warning: ${reason}. Further violations may submit your assignment automatically.`
            );
        }
    };

    // =========================================================
    // DATE FORMAT
    // =========================================================

    const formatDate = (date) => {
        if (!date) {
            return "No due date";
        }

        const parsedDate = new Date(date);

        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return "No due date";
        }

        return parsedDate.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };
    const formatTimeLeft = (seconds) => {
    if (
        seconds === null ||
        seconds === undefined
    ) {
        return "--:--";
    }

    const hours = Math.floor(
        seconds / 3600
    );

    const minutes = Math.floor(
        (seconds % 3600) / 60
    );

    const remainingSeconds =
        seconds % 60;

    if (hours > 0) {
        return `${String(hours).padStart(2, "0")}:${String(
            minutes
        ).padStart(2, "0")}:${String(
            remainingSeconds
        ).padStart(2, "0")}`;
    }

    return `${String(minutes).padStart(2, "0")}:${String(
        remainingSeconds
    ).padStart(2, "0")}`;
};
const enterFullscreen = async () => {
    try {
        await document.documentElement.requestFullscreen();

        setIsFullscreen(true);
        setShowFullscreenWarning(false);
    } catch (error) {
        console.error(
            "Failed to enter fullscreen:",
            error
        );

        toast.error(
            "Fullscreen mode could not be enabled. Please allow fullscreen access."
        );
    }
};

// =========================================================
// START EXAMINATION
// =========================================================

const handleStartExam = async () => {
    // Prevent double-click / repeated start requests
    if (startExamInProgressRef.current) {
        return;
    }

    startExamInProgressRef.current = true;

    try {
        // -----------------------------------------------------
        // GET ASSIGNMENT ID
        // -----------------------------------------------------

        const finalAssignmentId =
            assignment?.assignment_id ??
            assignment?.id ??
            assignmentId;

        if (!finalAssignmentId) {
            toast.error("Assignment ID is missing.");
            return;
        }

        // -----------------------------------------------------
        // VALIDATE FIXED EXAM WINDOW
        // -----------------------------------------------------

        if (
            !assignment?.start_date_time ||
            !assignment?.expires_at
        ) {
            toast.error(
                "Exam timing information is unavailable."
            );
            return;
        }

        const startTime = new Date(
            assignment.start_date_time
        ).getTime();

        const expiryTime = new Date(
            assignment.expires_at
        ).getTime();

        const currentTime = Date.now();

        if (
            Number.isNaN(startTime) ||
            Number.isNaN(expiryTime)
        ) {
            toast.error(
                "Exam timing information is invalid."
            );
            return;
        }

        if (currentTime < startTime) {
            const remaining = Math.max(
                0,
                Math.floor((startTime - currentTime) / 1000)
            );

            setTimeUntilStart(remaining);

            toast.info(
                `The examination starts in ${formatTimeLeft(remaining)}.`
            );

            return;
        }

        if (currentTime >= expiryTime) {
            toast.error(
                "The time limit for this assignment has expired."
            );
            return;
        }

        // -----------------------------------------------------
// ENTER FULLSCREEN FIRST
// -----------------------------------------------------

try {
    await document.documentElement.requestFullscreen();

    setIsFullscreen(true);
    setShowFullscreenWarning(false);

    setSecurityViolationCount(0);
    securityViolationCountRef.current = 0;
    setShowSecurityWarning(false);

} catch (fullscreenError) {
    console.error(
        "Fullscreen failed:",
        fullscreenError
    );

    toast.error(
        "Please allow fullscreen mode to continue."
    );

    setExamStarted(false);
    return;
}

// -----------------------------------------------------
// START BACKEND AFTER FULLSCREEN
// -----------------------------------------------------

const startResponse =
    await startStudentDescriptiveAssignment(
        Number(finalAssignmentId)
    );

console.log(
    "DESCRIPTIVE EXAM START RESPONSE:",
    startResponse
);

// -----------------------------------------------------
// SERVER CONFIRMED START
// -----------------------------------------------------

setExamStarted(true);
setTimeUntilStart(0);
setTimeExpired(false);

const fixedRemainingSeconds = Math.max(
    0,
    Math.floor(
        (expiryTime - Date.now()) / 1000
    )
);

setTimeLeft(fixedRemainingSeconds);

setAssignment((previous) => ({
    ...previous,
    started_at:
        startResponse?.started_at ||
        new Date().toISOString(),
    expires_at:
        previous?.expires_at ||
        assignment.expires_at,
}));

        toast.success(
            "Examination started. Please remain in fullscreen mode."
        );

    } catch (error) {
        console.error(
            "Failed to start examination:",
            error
        );

        setExamStarted(false);
        setTimeLeft(null);
        setTimeExpired(false);
        setIsFullscreen(false);

        const message =
            error?.response?.data?.detail ||
            "Failed to start the examination. Please try again.";

        toast.error(message);

    } finally {
        // Allow another click only after the current operation finishes
        startExamInProgressRef.current = false;
    }
};
 useEffect(() => {
    const handleFullscreenChange = () => {
        const fullscreenActive =
            document.fullscreenElement !== null;

        setIsFullscreen(fullscreenActive);

        // Student exited fullscreen during the exam.
        if (
            !fullscreenActive &&
            examStarted &&
            !submitted &&
            !timeExpired &&
            !autoSubmittedRef.current
        ) {
            setFullscreenViolationCount((previousCount) => {
                const newCount = previousCount + 1;
                setShowFullscreenWarning(true);

                // First fullscreen exit = warning only.
                // Second fullscreen exit = immediate auto-submit.
                if (newCount >= 2 && !autoSubmittedRef.current) {
                    autoSubmittedRef.current = true;
                    toast.error(
                        "You exited fullscreen again. Your assignment will be submitted automatically."
                    );
                    handleSubmit(true, "fullscreen");
                }

                return newCount;
            });
        }
    };

    document.addEventListener(
        "fullscreenchange",
        handleFullscreenChange
    );

    return () => {
        document.removeEventListener(
            "fullscreenchange",
            handleFullscreenChange
        );
    };
}, [
    examStarted,
    submitted,
    timeExpired,
]);
    // =========================================================
    // COPY / PASTE / RIGHT-CLICK / KEYBOARD SECURITY
    // =========================================================

    useEffect(() => {
        if (!examStarted || submitted || timeExpired) {
            return;
        }

        const handleContextMenu = (event) => {
            event.preventDefault();
            recordSecurityViolation(
                "Right-click is disabled during the examination"
            );
        };

        const handleCopy = (event) => {
            event.preventDefault();
            recordSecurityViolation(
                "Copy is disabled during the examination"
            );
        };

        const handleCut = (event) => {
            event.preventDefault();
            recordSecurityViolation(
                "Cut is disabled during the examination"
            );
        };

        const handlePaste = (event) => {
            event.preventDefault();
            recordSecurityViolation(
                "Paste is disabled during the examination"
            );
        };

        const handleKeyDown = (event) => {
            const key = event.key.toLowerCase();
            const ctrlOrMeta = event.ctrlKey || event.metaKey;

            const blockedShortcut =
                key === "f12" ||
                key === "f5" ||
                (ctrlOrMeta && ["r", "s", "p", "u"].includes(key)) ||
                (ctrlOrMeta &&
                    event.shiftKey &&
                    ["i", "j", "c"].includes(key)) ||
                (event.altKey &&
                    ["arrowleft", "arrowright"].includes(key));

            if (blockedShortcut) {
                event.preventDefault();
                event.stopPropagation();

                recordSecurityViolation(
                    `Blocked keyboard shortcut: ${event.key}`
                );
            }
        };

        document.addEventListener(
            "contextmenu",
            handleContextMenu
        );

        document.addEventListener("copy", handleCopy);
        document.addEventListener("cut", handleCut);
        document.addEventListener("paste", handlePaste);

        document.addEventListener(
            "keydown",
            handleKeyDown,
            true
        );

        return () => {
            document.removeEventListener(
                "contextmenu",
                handleContextMenu
            );

            document.removeEventListener(
                "copy",
                handleCopy
            );

            document.removeEventListener(
                "cut",
                handleCut
            );

            document.removeEventListener(
                "paste",
                handlePaste
            );

            document.removeEventListener(
                "keydown",
                handleKeyDown,
                true
            );
        };
    }, [
        examStarted,
        submitted,
        timeExpired,
        securityViolationCount,
    ]);

    // =========================================================
    // REFRESH / PAGE-LEAVE PROTECTION
    // =========================================================

    useEffect(() => {
        if (!examStarted || submitted || timeExpired) {
            return;
        }

        const handleBeforeUnload = (event) => {
            event.preventDefault();

            event.returnValue =
                "Your examination is still in progress. Leaving this page may interrupt your submission.";
        };

        window.addEventListener(
            "beforeunload",
            handleBeforeUnload
        );

        return () => {
            window.removeEventListener(
                "beforeunload",
                handleBeforeUnload
            );
        };
    }, [
        examStarted,
        submitted,
        timeExpired,
    ]);

    // =========================================================
    // BROWSER BACK-BUTTON PROTECTION
    // =========================================================

    useEffect(() => {
        if (!examStarted || submitted || timeExpired) {
            return;
        }

        window.history.pushState(
            { descriptiveExam: true },
            "",
            window.location.href
        );

        const handlePopState = () => {
            window.history.pushState(
                { descriptiveExam: true },
                "",
                window.location.href
            );

            recordSecurityViolation(
                "Browser back navigation is disabled during the examination"
            );
        };

        window.addEventListener(
            "popstate",
            handlePopState
        );

        return () => {
            window.removeEventListener(
                "popstate",
                handlePopState
            );
        };
    }, [
        examStarted,
        submitted,
        timeExpired,
        securityViolationCount,
    ]);

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-5xl mx-auto">

                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">

                        <Loader2
                            size={40}
                            className="mx-auto text-purple-600 animate-spin mb-4"
                        />

                        <h2 className="text-lg font-semibold text-gray-900">
                            Loading assignment...
                        </h2>

                        <p className="text-gray-500 mt-1">
                            Please wait while we load your assignment.
                        </p>

                    </div>

                </div>
            </div>
        );
    }

    // =========================================================
    // ERROR
    // =========================================================

    if (error || !assignment) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-5xl mx-auto">

                    <button
                        onClick={() =>
                            navigate(
                                "/student/dashboard"
                            )
                        }
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
                    >
                        <ArrowLeft size={18} />
                        Back to Dashboard
                    </button>

                    <div className="bg-white rounded-2xl shadow-sm p-10 text-center">

                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">

                            <AlertCircle
                                size={32}
                                className="text-red-600"
                            />

                        </div>

                        <h2 className="text-xl font-bold text-gray-900">
                            Unable to Load Assignment
                        </h2>

                        <p className="text-gray-500 mt-2">
                            {error ||
                                "The assignment could not be found."}
                        </p>

                        <button
                            onClick={() =>
                                navigate(
                                    "/student/dashboard"
                                )
                            }
                            className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition"
                        >
                            <ArrowLeft size={18} />
                            Back to Dashboard
                        </button>

                    </div>

                </div>
            </div>
        );
    }

    // =========================================================
    // ASSIGNMENT ID
    // =========================================================

    const currentAssignmentId =
        assignment?.assignment_id ??
        assignment?.id ??
        assignmentId;

    // =========================================================
    // START SCREEN
    // =========================================================

    // Do not show the actual questions before the student starts.
    if (!examStarted) {
        const startTimestamp = assignment?.start_date_time
            ? new Date(assignment.start_date_time).getTime()
            : NaN;

        const endTimestamp = assignment?.expires_at
            ? new Date(assignment.expires_at).getTime()
            : NaN;

        const now = Date.now();

        const hasValidTiming =
            !Number.isNaN(startTimestamp) &&
            !Number.isNaN(endTimestamp);

        const examNotStarted =
            hasValidTiming && now < startTimestamp;

        const examAlreadyExpired =
            hasValidTiming && now >= endTimestamp;

        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-xl border border-gray-100">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
                        <FileText size={30} />
                    </div>

                    <p className="text-sm font-medium text-purple-600">
                        Descriptive Assignment
                    </p>

                    <h1 className="mt-2 text-2xl font-bold text-gray-900">
                        {assignment?.title}
                    </h1>

                    <p className="mt-4 text-gray-600">
                        You are about to start your examination.
                    </p>

                    <div className="mt-6 rounded-xl bg-gray-50 p-4 text-left">
                        <div className="flex items-center justify-between py-2">
                            <span className="text-sm text-gray-500">Duration</span>
                            <span className="font-semibold text-gray-900">
                                {assignment?.duration_minutes
                                    ? `${assignment.duration_minutes} minutes`
                                    : "No time limit"}
                            </span>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-200 py-2">
                            <span className="text-sm text-gray-500">Questions</span>
                            <span className="font-semibold text-gray-900">
                                {questions.length}
                            </span>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-200 py-2">
                            <span className="text-sm text-gray-500">Total Marks</span>
                            <span className="font-semibold text-gray-900">
                                {totalMarks}
                            </span>
                        </div>
                    </div>

                    {assignment?.instructions && (
                        <div className="mt-5 rounded-xl bg-purple-50 border border-purple-100 p-4 text-left">
                            <p className="text-sm font-semibold text-purple-800">
                                Instructions
                            </p>
                            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-700">
                                {assignment.instructions}
                            </p>
                        </div>
                    )}

                    {examNotStarted && (
                        <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-5">
                            <p className="text-sm font-semibold text-blue-800">
                                Examination has not started yet
                            </p>

                            <p className="mt-2 text-sm text-blue-700">
                                The test will open at the scheduled start time.
                            </p>

                            <div className="mt-4 text-4xl font-bold tracking-wider text-blue-900">
                                {formatTimeLeft(timeUntilStart)}
                            </div>

                            <p className="mt-1 text-xs text-blue-700">
                                Time remaining until Start Test is enabled
                            </p>
                        </div>
                    )}

                    {examAlreadyExpired && (
                        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-5 text-left">
                            <p className="text-sm font-semibold text-red-800">
                                Examination window has expired
                            </p>
                            <p className="mt-2 text-sm text-red-700">
                                This examination can no longer be started.
                            </p>
                        </div>
                    )}

                    {!examNotStarted && !examAlreadyExpired && (
                        <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-left">
                            <p className="text-sm font-semibold text-green-800">
                                Examination is ready to start
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-green-700">
                                The timer uses the fixed examination end time. Starting late means less time remaining.
                            </p>
                        </div>
                    )}

                    <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-left">
                        <p className="text-sm font-semibold text-red-800">
                            Before you start
                        </p>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
                            <li>The examination will open in fullscreen mode.</li>
                            <li>The timer runs until the fixed examination end time.</li>
                            <li>Starting late gives you only the remaining time.</li>
                            <li>Do not switch tabs or exit fullscreen repeatedly.</li>
                            <li>Your work will be submitted automatically when the time expires.</li>
                        </ul>
                    </div>

                    <button
                        type="button"
                        onClick={handleStartExam}
                        disabled={
                            !hasValidTiming ||
                            examNotStarted ||
                            examAlreadyExpired
                        }
                        className={`mt-6 w-full rounded-xl px-6 py-3.5 font-semibold text-white transition ${
                            !hasValidTiming ||
                            examNotStarted ||
                            examAlreadyExpired
                                ? "cursor-not-allowed bg-gray-400"
                                : "bg-purple-600 hover:bg-purple-700"
                        }`}
                    >
                        {examNotStarted
                            ? `Start Test in ${formatTimeLeft(timeUntilStart)}`
                            : examAlreadyExpired
                                ? "Exam Expired"
                                : "Start Test"}
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/student/dashboard")}
                        className="mt-3 w-full rounded-xl border border-gray-200 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // =========================================================
    // MAIN UI
    // =========================================================

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">

            <div className="max-w-5xl mx-auto">
                    {/* =====================================================
        FIXED EXAM TIMER
    ====================================================== */}

    {assignment?.duration_minutes && (
        <div className="sticky top-0 z-50 bg-gray-50 py-3">
            <div className="rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4 shadow-sm flex items-center justify-between">
                
                <div className="flex items-center gap-3">
                    <div className="text-2xl">
                        ⏱️
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-600">
                            Time Remaining
                              </p>

                        <p
                            className={`text-2xl font-bold ${
                                timeLeft !== null &&
                                timeLeft <= 300
                                    ? "text-red-600"
                                    : "text-gray-900"
                            }`}
                        >
                            {formatTimeLeft(timeLeft)}
                        </p>
                    </div>
                </div>

                <div className="text-sm text-gray-500">
                    {assignment.duration_minutes} minutes
                </div>

            </div>
        </div>
    )}
    {timeExpired && (
    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
        <div className="font-semibold">
            ⏰ Time is over
        </div>

        <div className="text-sm mt-1">
            Your assignment is being submitted automatically.
        </div>
    </div>
)}
{showTabWarning && (
    <div className="mb-4 rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
            <div>
                <p className="font-semibold text-yellow-800">
                    ⚠️ Examination Warning
                </p>

                <p className="mt-1 text-sm text-yellow-700">
                    You left the examination tab.
                    Please remain on this page during the exam.
                </p>

                <p className="mt-2 text-xs font-medium text-yellow-800">
                    Tab switches detected: {tabSwitchCount}
                </p>
            </div>

            <button
                type="button"
                onClick={() =>
                    setShowTabWarning(false)
                }
                className="text-yellow-700 hover:text-yellow-900"
            >
                ✕
            </button>
        </div>
    </div>
)}
{showFullscreenWarning && (
    <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
            <div>
                <p className="font-semibold text-red-800">
                    ⚠️ Fullscreen Mode Required
                </p>

                <p className="mt-1 text-sm text-red-700">
                    You exited fullscreen mode.
                    Please return to fullscreen to continue
                    the examination.
                </p>

                <p className="mt-2 text-xs font-medium text-red-800">
                    Fullscreen violations:{" "}
                    {fullscreenViolationCount}
                </p>

                <button
                    type="button"
                    onClick={enterFullscreen}
                    className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                    Return to Fullscreen
                </button>
            </div>
        </div>
    </div>
)}

{showSecurityWarning && securityViolationCount > 0 && (
    <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
            <div>
                <p className="font-semibold text-red-800">
                    ⚠️ Security Warning
                </p>

                <p className="mt-1 text-sm text-red-700">
                    Restricted browser actions are monitored during
                    the examination.
                </p>

                <p className="mt-2 text-xs font-medium text-red-800">
                    Security violations:{" "}
                    {securityViolationCount}
                </p>
            </div>

            <button
                type="button"
                onClick={() =>
                    setShowSecurityWarning(false)
                }
                className="text-red-700 hover:text-red-900"
            >
                ✕
            </button>
        </div>
    </div>
)}

                {/* BACK BUTTON */}

                <button
                    onClick={() =>
                        navigate(
                            "/student/dashboard"
                        )
                    }
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-5 transition"
                >
                    <ArrowLeft size={18} />
                    Back to Dashboard
                </button>
                

                {/* HEADER */}

                <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">

                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 md:p-8 text-white">

                        <div className="flex gap-4">

                            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                                <FileText size={28} />
                            </div>

                            <div>

                                <p className="text-purple-100 text-sm font-medium">
                                    Descriptive Assignment
                                </p>
                                

                                <h1 className="text-2xl md:text-3xl font-bold mt-1">
                                    {assignment.title}
                                </h1>

                                <p className="text-purple-100 mt-2">
                                    Assignment #
                                    {currentAssignmentId}
                                </p>

                            </div>

                        </div>

                    </div>

                    {/* META */}

                    <div className="p-5 md:p-6">

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                            {/* QUESTIONS */}

                            <div className="flex items-center gap-3">

                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <ClipboardList
                                        size={20}
                                        className="text-blue-600"
                                    />
                                </div>

                                <div>

                                    <p className="text-xs text-gray-500 uppercase font-medium">
                                        Questions
                                    </p>

                                    <p className="font-semibold text-gray-900">
                                        {questions.length}
                                    </p>

                                </div>

                            </div>

                            {/* MARKS */}

                            <div className="flex items-center gap-3">

                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <CheckCircle
                                        size={20}
                                        className="text-green-600"
                                    />
                                </div>

                                <div>

                                    <p className="text-xs text-gray-500 uppercase font-medium">
                                        Total Marks
                                    </p>

                                    <p className="font-semibold text-gray-900">
                                        {totalMarks}
                                    </p>

                                </div>

                            </div>

                            {/* DUE DATE */}

                            <div className="flex items-center gap-3">

                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <CalendarDays
                                        size={20}
                                        className="text-orange-600"
                                    />
                                </div>

                                <div>

                                    <p className="text-xs text-gray-500 uppercase font-medium">
                                        Due Date
                                    </p>

                                    <p className="font-semibold text-gray-900">
                                        {formatDate(
                                            assignment.due_date
                                        )}
                                    </p>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

                {/* INSTRUCTIONS */}

                {assignment.instructions && (
                    <div className="bg-white rounded-2xl shadow-sm p-5 md:p-6 mb-6">

                        <div className="flex items-center gap-3 mb-3">

                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">

                                <FileText
                                    size={20}
                                    className="text-purple-600"
                                />

                            </div>

                            <h2 className="text-lg font-bold text-gray-900">
                                Instructions
                            </h2>

                        </div>

                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-gray-700 whitespace-pre-line leading-relaxed">
                            {assignment.instructions}
                        </div>

                    </div>
                    
                )}

                {/* QUESTIONS */}

                <div className="space-y-5">

                    {questions.length === 0 ? (

                        <div className="bg-white rounded-2xl shadow-sm p-10 text-center">

                            <ClipboardList
                                size={45}
                                className="mx-auto text-gray-300 mb-4"
                            />

                            <h2 className="text-lg font-semibold">
                                No Questions Found
                            </h2>

                            <p className="text-gray-500 mt-1">
                                This assignment does not contain any questions.
                            </p>

                        </div>

                    ) : (

                        questions.map(
                            (question, index) => {

                                const questionId =
                                    getQuestionId(
                                        question
                                    );

                                const answer =
                                    questionId !== null
                                        ? answers[
                                              questionId
                                          ] || ""
                                        : "";

                                const drawing =
                                    questionId !== null
                                        ? drawings[
                                              questionId
                                          ] ?? null
                                        : null;

                                const hasTextAnswer =
                                    typeof answer ===
                                    "string"
                                        ? answer.trim().length >
                                          0
                                        : Boolean(answer);

                                const hasQuestionDrawing =
                                    hasDrawing(
                                        drawing
                                    );

                                const isEmpty =
                                    !hasTextAnswer &&
                                    !hasQuestionDrawing;

                                const maxMarks =
                                    question?.max_marks ??
                                    question?.marks ??
                                    0;

                                return (
                                    <div
                                        key={
                                            questionId ??
                                            index
                                        }
                                        id={`question-${questionId ?? index}`}
                                        className="bg-white rounded-2xl shadow-sm p-5 md:p-7"
                                    >

                                        {/* QUESTION HEADER */}

                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">

                                            <div className="flex gap-3">

                                                <div className="w-9 h-9 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center font-bold shrink-0">
                                                    {index + 1}
                                                </div>

                                                <div>

                                                    <p className="text-xs text-gray-500 uppercase font-medium mb-1">
                                                        Question{" "}
                                                        {index + 1}
                                                    </p>

                                                    <h2 className="text-lg md:text-xl font-semibold text-gray-900 leading-relaxed">
                                                        {
                                                            question.question_text
                                                        }
                                                    </h2>

                                                </div>

                                            </div>

                                            <div className="shrink-0">

                                                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold">

                                                    {maxMarks}{" "}
                                                    {Number(
                                                        maxMarks
                                                    ) === 1
                                                        ? "Mark"
                                                        : "Marks"}

                                                </span>

                                            </div>

                                        </div>

                                        {/* ANSWER TEXT */}

                                        <div>

                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Your Answer
                                            </label>

                                            <textarea
                                                value={answer}
                                                onChange={(e) =>
                                                    handleAnswerChange(
                                                        questionId,
                                                        e.target.value
                                                    )
                                                }
                                                disabled={
                                                    timeExpired ||
                                                    submitting
                                                }
                                                rows={8}
                                                placeholder="Write your answer here..."
                                                className={`w-full border-2 rounded-xl px-4 py-3 text-gray-800 resize-y outline-none transition ${
                                                    isEmpty
                                                        ? "border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                                                        : "border-green-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                                                } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                                            />

                                            <div className="flex items-center justify-between mt-2">

                                                <p className="text-xs text-gray-400">
                                                    Write your answer clearly and completely.
                                                </p>

                                                <p className="text-xs text-gray-400">
                                                    {answer.length}{" "}
                                                    characters
                                                </p>

                                            </div>

                                        </div>

                                        {/* =================================================
                                            DRAWING PAD
                                           ================================================= */}

                                        <div className="mt-6">

                                            <div className="flex items-center justify-between mb-2">

                                                <label className="block text-sm font-semibold text-gray-700">
                                                    Add Drawing / Figure
                                                </label>

                                                <span className="text-xs text-gray-400">
                                                    Optional
                                                </span>

                                            </div>

                                            <AnswerDrawingPad
                                                value={
                                                    drawing
                                                }
                                                onChange={(
                                                    newDrawing
                                                ) =>
                                                    handleDrawingChange(
                                                        questionId,
                                                        newDrawing
                                                    )
                                                }
                                                disabled={
                                                    timeExpired ||
                                                    submitting
                                                }
                                            />

                                            <p className="text-xs text-gray-400 mt-2">
                                                You can draw a diagram, figure, flowchart, or any other supporting illustration.
                                            </p>

                                        </div>

                                    </div>
                                );
                            }
                        )
                    )}

                </div>

                {/* SUBMIT */}

                {questions.length > 0 && (

                    <div className="bg-white rounded-2xl shadow-sm p-5 md:p-6 mt-6 mb-8">

                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                            <div>

                                <h2 className="font-bold text-gray-900">
                                    Ready to submit?
                                </h2>

                                {unansweredQuestions.length > 0 ? (

                                    <p className="text-sm text-orange-600 mt-1">

                                        {unansweredQuestions.length}{" "}
                                        question
                                        {unansweredQuestions.length >
                                        1
                                            ? "s"
                                            : ""}{" "}
                                        remaining

                                    </p>

                                ) : (

                                    <p className="text-sm text-green-600 mt-1 flex items-center gap-1">

                                        <CheckCircle
                                            size={15}
                                        />

                                        All questions answered

                                    </p>

                                )}

                            </div>

                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={
                                    submitting ||
                                    unansweredQuestions.length >
                                        0
                                }
                                className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >

                                {submitting ? (

                                    <>
                                        <Loader2
                                            size={19}
                                            className="animate-spin"
                                        />

                                        Submitting...
                                    </>

                                ) : (

                                    <>
                                        <Send
                                            size={19}
                                        />

                                        Submit Assignment
                                    </>

                                )}

                            </button>

                        </div>

                    </div>

                )}

            </div>

        </div>
    );
};

export default StudentDescriptiveAssignment