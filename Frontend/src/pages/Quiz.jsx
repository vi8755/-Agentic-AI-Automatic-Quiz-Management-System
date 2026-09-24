import { useEffect, useRef, useState } from "react";
import {
    useNavigate,
    useParams,
    useLocation,
} from "react-router-dom";
import { toast } from "react-toastify";
import API_BASE_URL from "../config";
import "./Quiz.css";

function Quiz() {

    const { id, token } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const studentEmail = new URLSearchParams(
        location.search
    ).get("email");

    // -----------------------------------------
    // Quiz State
    // -----------------------------------------

    const [quiz, setQuiz] = useState(null);
    const [assignmentId, setAssignmentId] = useState(null);

    const [answers, setAnswers] = useState({});

    const [loading, setLoading] = useState(true);

    const [timeLeft, setTimeLeft] = useState(0);

    // Scheduled quiz start countdown
    const [preStartRemaining, setPreStartRemaining] = useState(0);
    const [canStart, setCanStart] = useState(false);

    const [submitting, setSubmitting] = useState(false);

    // -----------------------------------------
    // Security State
    // -----------------------------------------

    const [quizStarted, setQuizStarted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [securityViolation, setSecurityViolation] = useState(false);

    // -----------------------------------------
    // Refs
    // -----------------------------------------

    const timerRef = useRef(null);

    const submittedRef = useRef(false);

    // Keeps latest answers available for
    // timer/security auto-submit.
    const answersRef = useRef({});

    // Prevents security handlers from firing
    // during intentional submission.
    const quizStartedRef = useRef(false);

    // -----------------------------------------
    // Keep answersRef synchronized
    // -----------------------------------------

    useEffect(() => {

        answersRef.current = answers;

    }, [answers]);

    // -----------------------------------------
    // Save Answers
    // -----------------------------------------

    useEffect(() => {

        if (!assignmentId) return;

        localStorage.setItem(
            `quiz_answers_${assignmentId}`,
            JSON.stringify(answers)
        );

    }, [answers, assignmentId]);

    // -----------------------------------------
    // Load Quiz
    // -----------------------------------------

    useEffect(() => {

        const fetchQuiz = async () => {

            try {

                let response;

                if (token) {

                    response = await fetch(
                        `${API_BASE_URL}/start/${token}`
                    );

                } else {

                    response = await fetch(
                        `${API_BASE_URL}/get_quiz/${id}`
                    );

                }

                const data = await response.json();

                if (!response.ok) {

                    toast.error(
                        data.detail ||
                        "Unable to load quiz."
                    );

                    return;
                }

                setQuiz(data);

                // -----------------------------------------
                // Assignment
                // -----------------------------------------

                if (data.assignment_id) {

                    setAssignmentId(
                        data.assignment_id
                    );

                    const savedAnswers =
                        localStorage.getItem(
                            `quiz_answers_${data.assignment_id}`
                        );

                    if (savedAnswers) {

                        try {

                            const parsedAnswers =
                                JSON.parse(savedAnswers);

                            setAnswers(parsedAnswers);

                            answersRef.current =
                                parsedAnswers;

                        } catch (error) {

                            console.warn(
                                "Failed to restore saved answers:",
                                error
                            );

                            localStorage.removeItem(
                                `quiz_answers_${data.assignment_id}`
                            );

                        }

                    }

                }

                // -----------------------------------------
                // Scheduled Start / Already Started
                // -----------------------------------------

                if (data.already_started) {

                    setCanStart(true);
                    setQuizStarted(true);
                    quizStartedRef.current = true;

                } else if (data.can_start) {

                    setCanStart(true);

                } else {

                    setCanStart(false);

                }

                if (data.quiz_expires_at) {

                    const expiry =
                        new Date(
                            data.quiz_expires_at
                        ).getTime();

                    const remaining =
                        Math.max(
                            0,
                            Math.ceil(
                                (expiry - Date.now()) / 1000
                            )
                        );

                    setTimeLeft(remaining);

                }

                if (data.start_time && !data.already_started) {

                    const startTime =
                        new Date(data.start_time).getTime();

                    const remaining =
                        Math.max(
                            0,
                            Math.ceil(
                                (startTime - Date.now()) / 1000
                            )
                        );

                    setPreStartRemaining(remaining);

                    setCanStart(remaining <= 0 || data.can_start);

                } else if (!data.start_time) {

                    setPreStartRemaining(0);
                    setCanStart(true);

                }

            } catch (error) {

                console.error(
                    "Failed to load quiz:",
                    error
                );

                toast.error(
                    "Failed to load quiz."
                );

            } finally {

                setLoading(false);

            }

        };

        fetchQuiz();

    }, [id, token]);

    // -----------------------------------------
    // Prevent Multiple Tabs
    // -----------------------------------------

    useEffect(() => {

        if (!assignmentId) return;

        const storageKey =
            `quiz_tab_${assignmentId}`;

        if (localStorage.getItem(storageKey)) {

            toast.error(
                "This quiz is already open in another tab."
            );

            navigate("/");

            return;
        }

        localStorage.setItem(
            storageKey,
            "OPEN"
        );

        return () => {

            localStorage.removeItem(
                storageKey
            );

        };

    }, [assignmentId, navigate]);

    // -----------------------------------------
    // Release Lock On Close
    // -----------------------------------------

    useEffect(() => {

        if (!assignmentId) return;

        const storageKey =
            `quiz_tab_${assignmentId}`;

        const handleUnload = () => {

            localStorage.removeItem(
                storageKey
            );

        };

        window.addEventListener(
            "beforeunload",
            handleUnload
        );

        return () => {

            window.removeEventListener(
                "beforeunload",
                handleUnload
            );

        };

    }, [assignmentId]);

    // -----------------------------------------
    // Start Quiz In Fullscreen
    // -----------------------------------------

    const handleEnterFullscreen = async () => {

    if (!quiz || submittedRef.current || !canStart) {
        return;
    }

    try {

        // -----------------------------------------
        // 1. ENTER FULLSCREEN IMMEDIATELY
        //    while browser still has user gesture
        // -----------------------------------------

        if (!document.fullscreenElement) {

            await document.documentElement.requestFullscreen();

        }

        setIsFullscreen(true);

        // -----------------------------------------
        // 2. NOW START THE SERVER ATTEMPT
        // -----------------------------------------

        let startedQuiz = quiz;

        if (!quiz.already_started) {

            const response = await fetch(
                `${API_BASE_URL}/start-attempt/${token}`,
                {
                    method: "POST",
                }
            );

            const data = await response.json();

            if (!response.ok) {

                toast.error(
                    data.detail ||
                    "Quiz cannot be started yet."
                );

                // If server rejected the attempt,
                // leave fullscreen.
                if (document.fullscreenElement) {
                    try {
                        await document.exitFullscreen();
                    } catch (error) {
                        console.warn(
                            "Unable to exit fullscreen:",
                            error
                        );
                    }
                }

                setIsFullscreen(false);
                return;
            }

            startedQuiz = data;

            setQuiz(data);

            if (data.assignment_id) {
                setAssignmentId(data.assignment_id);
            }
        }

        // -----------------------------------------
        // 3. SET TIMER FROM SERVER EXPIRY
        // -----------------------------------------

        if (startedQuiz.quiz_expires_at) {

            const expiry =
                new Date(
                    startedQuiz.quiz_expires_at
                ).getTime();

            const remaining =
                Math.max(
                    0,
                    Math.ceil(
                        (expiry - Date.now()) / 1000
                    )
                );

            setTimeLeft(remaining);
        }

        // -----------------------------------------
        // 4. NOW MARK QUIZ AS STARTED
        // -----------------------------------------

        setQuiz(startedQuiz);
        setCanStart(true);

        quizStartedRef.current = true;
        setQuizStarted(true);
        setSecurityViolation(false);

        setIsFullscreen(
            !!document.fullscreenElement
        );

        toast.success(
            "Quiz started. Good luck!"
        );

    } catch (error) {

        console.error(
            "Unable to start quiz:",
            error
        );

        toast.error(
            "Unable to start the quiz. Please try again."
        );

    }
};

    // -----------------------------------------
    // Fullscreen Security
    // -----------------------------------------

    useEffect(() => {

        if (!quiz) return;

        const handleFullscreenChange = () => {

            const fullscreenActive =
                !!document.fullscreenElement;

            setIsFullscreen(
                fullscreenActive
            );

            // Ignore fullscreen changes before
            // the student actually starts the quiz.
            if (!quizStartedRef.current) {
                return;
            }

            // Ignore after successful submission.
            if (submittedRef.current) {
                return;
            }

            // Student exited fullscreen.
            if (!fullscreenActive) {

                setSecurityViolation(true);

                toast.warning(
                    "Fullscreen mode exited. Your quiz will be submitted."
                );

                submitQuiz(
                    true,
                    "Fullscreen mode exited"
                );

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

    }, [quiz]);

     // -----------------------------------------
// Tab Switch / Visibility Security
// -----------------------------------------

    useEffect(() => {

    if (!quiz) return;

    const handleVisibilityChange = () => {

        if (!quizStartedRef.current) {
            return;
        }

        if (submittedRef.current) {
            return;
        }

        if (document.hidden) {

            setSecurityViolation(true);

            toast.warning(
                "You left the quiz tab. Your quiz will be submitted."
            );

            submitQuiz(
                true,
                "Quiz tab was switched"
            );
        }
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

}, [quiz]);

    // -----------------------------------------
    // Window Focus Security
    // -----------------------------------------

    useEffect(() => {

        if (!quiz) return;

        const handleBlur = () => {

            if (!quizStartedRef.current) {
                return;
            }

            if (submittedRef.current) {
                return;
            }

            setSecurityViolation(true);

        };

        const handleFocus = () => {

            if (!submittedRef.current) {

                setSecurityViolation(false);

            }

        };

        window.addEventListener(
            "blur",
            handleBlur
        );

        window.addEventListener(
            "focus",
            handleFocus
        );

        return () => {

            window.removeEventListener(
                "blur",
                handleBlur
            );

            window.removeEventListener(
                "focus",
                handleFocus
            );

        };

    }, [quiz]);

    // -----------------------------------------
    // Scheduled Start Countdown
    // -----------------------------------------

    useEffect(() => {

        if (quizStarted || !quiz?.start_time) {
            return;
        }

        const updatePreStartCountdown = () => {

            const startTime =
                new Date(quiz.start_time).getTime();

            const remaining = Math.max(
                0,
                Math.ceil(
                    (startTime - Date.now()) / 1000
                )
            );

            setPreStartRemaining(remaining);

            if (remaining <= 0) {
                setCanStart(true);
            }

        };

        updatePreStartCountdown();

        const interval = setInterval(
            updatePreStartCountdown,
            500
        );

        return () => clearInterval(interval);

    }, [quiz, quizStarted]);

    // -----------------------------------------
    // Countdown Timer
    // -----------------------------------------

    useEffect(() => {

        if (
            !quiz ||
            !quizStarted ||
            !quiz.quiz_expires_at ||
            submittedRef.current
        ) {
            return;
        }

        const updateTimer = () => {

            const expiry =
                new Date(
                    quiz.quiz_expires_at
                ).getTime();

            const remaining = Math.max(
                0,
                Math.ceil(
                    (expiry - Date.now()) / 1000
                )
            );

            setTimeLeft(remaining);

            if (remaining <= 0) {

                clearInterval(timerRef.current);

                handleAutoSubmit();

            }

        };

        updateTimer();

        timerRef.current = setInterval(
            updateTimer,
            250
        );

        return () => {

            clearInterval(timerRef.current);

        };

    }, [quiz, quizStarted]);

    // -----------------------------------------
    // Warn Before Leaving Page
    // -----------------------------------------

    useEffect(() => {

        const handleBeforeUnload = (event) => {

            if (submittedRef.current) {
                return;
            }

            if (!quizStartedRef.current) {
                return;
            }

            event.preventDefault();

            event.returnValue = "";

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

    }, []);

    // -----------------------------------------
    // Prevent Browser Back
    // -----------------------------------------

    useEffect(() => {

        if (!quizStarted) {
            return;
        }

        window.history.pushState(
            null,
            "",
            window.location.href
        );

        const handlePopState = () => {

            window.history.pushState(
                null,
                "",
                window.location.href
            );

            toast.warning(
                "You cannot go back during the quiz."
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

    }, [quizStarted]);

    // -----------------------------------------
    // Disable Right Click
    // -----------------------------------------

    useEffect(() => {

        if (!quizStarted) {
            return;
        }

        const disableMenu = (e) => {

            e.preventDefault();

        };

        document.addEventListener(
            "contextmenu",
            disableMenu
        );

        return () => {

            document.removeEventListener(
                "contextmenu",
                disableMenu
            );

        };

    }, [quizStarted]);

    // -----------------------------------------
    // Disable Some Shortcuts
    // -----------------------------------------

    useEffect(() => {

        if (!quizStarted) {
            return;
        }

        const handleKeyDown = (e) => {

            // F12
            if (e.key === "F12") {

                e.preventDefault();

            }

            // Ctrl + Shift + I
            // Ctrl + Shift + J
            // Ctrl + Shift + C
            if (
                e.ctrlKey &&
                e.shiftKey &&
                (
                    e.key === "I" ||
                    e.key === "J" ||
                    e.key === "C"
                )
            ) {

                e.preventDefault();

            }

            // Ctrl + U
            if (
                e.ctrlKey &&
                e.key === "U"
            ) {

                e.preventDefault();

            }

        };

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {

            window.removeEventListener(
                "keydown",
                handleKeyDown
            );

        };

    }, [quizStarted]);

    // -----------------------------------------
    // Timer Display
    // -----------------------------------------

    function formatTime(seconds) {

        const safeSeconds =
            Math.max(
                0,
                Number(seconds) || 0
            );

        const minutes =
            Math.floor(
                safeSeconds / 60
            );

        const secs =
            safeSeconds % 60;

        return `${String(minutes).padStart(
            2,
            "0"
        )}:${String(secs).padStart(
            2,
            "0"
        )}`;

    }

    // -----------------------------------------
    // Select Answer
    // -----------------------------------------

    function handleAnswer(
        questionIndex,
        option
    ) {

        if (
            !quizStarted ||
            timeLeft <= 0 ||
            submitting
        ) {
            return;
        }

        setAnswers(prev => {

            const updatedAnswers = {

                ...prev,

                [questionIndex]: option

            };

            answersRef.current =
                updatedAnswers;

            return updatedAnswers;

        });

    }

    // -----------------------------------------
    // Common Submit Function
    // -----------------------------------------

    async function submitQuiz(
        autoSubmit = false,
        reason = ""
    ) {

        if (
            submittedRef.current ||
            submitting
        ) {
            return;
        }

        if (!quiz) {
            return;
        }

        const currentAnswers =
            answersRef.current;

        // -----------------------------------------
        // Manual Submission Validation
        // -----------------------------------------

        if (
            !autoSubmit &&
            Object.keys(currentAnswers).length !==
                quiz.questions.length
        ) {

            toast.warning(
                "Please answer all questions."
            );

            return;

        }

        submittedRef.current = true;

        setSubmitting(true);

        quizStartedRef.current = false;

        clearInterval(
            timerRef.current
        );

        try {

            const response = await fetch(
                `${API_BASE_URL}/submit_quiz`,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({

                        assignment_id:
                            assignmentId,

                        quiz_id:
                            quiz.quiz_id ||
                            quiz.id,

                        student_email:
                            quiz.student_email ||
                            studentEmail,

                        answers:
                            currentAnswers,

                        auto_submit:
                            autoSubmit,

                    }),

                }
            );

            const data =
                await response.json();

            if (!response.ok) {

                toast.error(
                    data.detail ||
                    "Submission failed."
                );

                submittedRef.current = false;

                quizStartedRef.current =
                    quizStarted;

                setSubmitting(false);

                return;

            }

            // -----------------------------------------
            // Success Message
            // -----------------------------------------

            if (reason) {

                toast.info(
                    `${reason}. Quiz submitted automatically.`
                );

            } else if (autoSubmit) {

                toast.info(
                    "Time's up! Quiz submitted automatically."
                );

            } else {

                toast.success(
                    "Quiz submitted successfully!"
                );

            }

            // -----------------------------------------
            // Clear Local Quiz Data
            // -----------------------------------------

            localStorage.removeItem(
                `quiz_answers_${assignmentId}`
            );

            localStorage.removeItem(
                `quiz_tab_${assignmentId}`
            );

            // -----------------------------------------
            // Exit Fullscreen
            // -----------------------------------------

            if (document.fullscreenElement) {

                try {

                    await document.exitFullscreen();

                } catch (error) {

                    console.warn(
                        "Unable to exit fullscreen:",
                        error
                    );

                }

            }

            // -----------------------------------------
            // Navigate To Result
            // -----------------------------------------
            navigate(
      `/student/result/${data.response_id}?token=${encodeURIComponent(token)}`
);
 

        } catch (error) {

            console.error(
                "Quiz submission error:",
                error
            );

            submittedRef.current = false;

            quizStartedRef.current =
                quizStarted;

            setSubmitting(false);

            toast.error(
                "Unable to submit quiz."
            );

        }

    }

    // -----------------------------------------
    // Auto Submit
    // -----------------------------------------

    function handleAutoSubmit() {

        submitQuiz(
            true,
            "Time's up"
        );

    }

    // -----------------------------------------
    // Loading
    // -----------------------------------------

    if (loading) {

        return (
            <h2>
                Loading Quiz...
            </h2>
        );

    }

    // -----------------------------------------
    // Quiz Not Found
    // -----------------------------------------

    if (!quiz) {

        return (
            <h2>
                Quiz not found.
            </h2>
        );

    }

    // -----------------------------------------
    // Pre-Start / Fullscreen Start Screen
    // -----------------------------------------

    if (!quizStarted) {

        const startDate = quiz.start_time
            ? new Date(quiz.start_time)
            : null;

        const startTimeText = startDate
            ? startDate.toLocaleString([], {
                dateStyle: "medium",
                timeStyle: "short",
            })
            : "Available now";

        return (

            <div
                className="quiz-page"
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px",
                }}
            >

                <div
                    style={{
                        width: "100%",
                        maxWidth: "560px",
                        background: "#ffffff",
                        borderRadius: "20px",
                        padding: "32px",
                        textAlign: "center",
                        boxShadow:
                            "0 10px 30px rgba(0,0,0,0.08)",
                    }}
                >

                    <div
                        style={{
                            fontSize: "42px",
                            marginBottom: "15px",
                        }}
                    >
                        {canStart ? "🔒" : "⏳"}
                    </div>

                    <h1
                        style={{
                            fontSize: "26px",
                            fontWeight: "700",
                            marginBottom: "10px",
                        }}
                    >
                        {canStart
                            ? "Ready to Start?"
                            : "Quiz Not Started Yet"}
                    </h1>

                    <p
                        style={{
                            color: "#64748b",
                            lineHeight: "1.6",
                            marginBottom: "20px",
                        }}
                    >
                        {canStart
                            ? "The quiz is now available. Enter fullscreen mode to begin your attempt."
                            : "You can open this quiz before the scheduled time, but the attempt and timer will start only at the scheduled time."}
                    </p>

                    <div
                        style={{
                            background: canStart
                                ? "#eef2ff"
                                : "#f8fafc",
                            borderRadius: "14px",
                            padding: "20px",
                            marginBottom: "24px",
                        }}
                    >

                        <p
                            style={{
                                margin: "0 0 8px",
                                fontSize: "14px",
                                color: "#64748b",
                            }}
                        >
                            Scheduled Start
                        </p>

                        <p
                            style={{
                                margin: "0",
                                fontSize: "18px",
                                fontWeight: "700",
                            }}
                        >
                            {startTimeText}
                        </p>

                        {!canStart && (
                            <>
                                <p
                                    style={{
                                        margin: "18px 0 5px",
                                        fontSize: "13px",
                                        color: "#64748b",
                                    }}
                                >
                                    Quiz starts in
                                </p>

                                <div
                                    style={{
                                        fontSize: "34px",
                                        fontWeight: "800",
                                        letterSpacing: "1px",
                                    }}
                                >
                                    {formatTime(
                                        preStartRemaining
                                    )}
                                </div>
                            </>
                        )}

                    </div>

                    <div
                        style={{
                            textAlign: "left",
                            background: "#f8fafc",
                            borderRadius: "14px",
                            padding: "16px",
                            marginBottom: "24px",
                        }}
                    >

                        <p
                            style={{
                                margin: "6px 0",
                                fontSize: "14px",
                            }}
                        >
                            ✓ Fullscreen mode required
                        </p>

                        <p
                            style={{
                                margin: "6px 0",
                                fontSize: "14px",
                            }}
                        >
                            ✓ Timer starts when your attempt starts
                        </p>

                        <p
                            style={{
                                margin: "6px 0",
                                fontSize: "14px",
                            }}
                        >
                            ✓ Questions and options are randomized for your attempt
                        </p>

                        <p
                            style={{
                                margin: "6px 0",
                                fontSize: "14px",
                            }}
                        >
                            ✓ Tab switching is monitored
                        </p>

                    </div>

                    <button
                        type="button"
                        onClick={handleEnterFullscreen}
                        disabled={!canStart || submitting}
                        style={{
                            width: "100%",
                            padding: "13px 20px",
                            borderRadius: "12px",
                            border: "none",
                            background: canStart
                                ? "#4f46e5"
                                : "#cbd5e1",
                            color: "#ffffff",
                            fontSize: "16px",
                            fontWeight: "600",
                            cursor: canStart
                                ? "pointer"
                                : "not-allowed",
                            opacity: canStart ? 1 : 0.8,
                        }}
                    >
                        {canStart
                            ? "Enter Fullscreen & Start Quiz"
                            : "Start Quiz Disabled"}
                    </button>

                </div>

            </div>

        );

    }

    // -----------------------------------------
    // Quiz UI
    // -----------------------------------------

    return (

        <div className="quiz-page">

            <div className="quiz-container">

                {/* -----------------------------------------
                    Security Warning
                ----------------------------------------- */}

                {securityViolation && (

                    <div
                        style={{
                            marginBottom: "15px",
                            padding: "12px 15px",
                            borderRadius: "10px",
                            background: "#fff7ed",
                            border:
                                "1px solid #fed7aa",
                            color: "#c2410c",
                            fontSize: "14px",
                            fontWeight: "500",
                        }}
                    >
                        ⚠️ Security warning: Please
                        remain on this quiz page and
                        keep fullscreen mode enabled.
                    </div>

                )}

                {/* -----------------------------------------
                    Fullscreen Status
                ----------------------------------------- */}

                {!isFullscreen && (

                    <div
                        style={{
                            marginBottom: "15px",
                            padding: "12px 15px",
                            borderRadius: "10px",
                            background: "#fef2f2",
                            border:
                                "1px solid #fecaca",
                            color: "#b91c1c",
                            fontSize: "14px",
                            fontWeight: "600",
                        }}
                    >
                        Fullscreen mode is not active.
                        Your quiz will be submitted.
                    </div>

                )}

                {/* -----------------------------------------
                    Timer
                ----------------------------------------- */}

                <div className="timer-box">

                    ⏰ Time Remaining

                    <div className="timer">

                        {formatTime(timeLeft)}

                    </div>

                </div>

                {/* -----------------------------------------
                    Quiz Title
                ----------------------------------------- */}

                <h1>
                    {quiz.title}
                </h1>

                {/* -----------------------------------------
                    Questions
                ----------------------------------------- */}

                {quiz.questions.map(
                    (q, index) => (

                        <div
                            className="question-card"
                            key={index}
                        >

                            <h3>

                                {index + 1}.
                                {" "}
                                {q.question}

                            </h3>

                            <div className="options">

                                {q.options.map(
                                    (option) => {

                                        // New backend format:
                                        // { key: "A", text: "Option text" }
                                        const optionLetter =
                                            option.key;

                                        return (

                                            <label
                                                key={optionLetter}
                                                className="option"
                                            >

                                                <input
                                                    disabled={
                                                        timeLeft <= 0 ||
                                                        submitting
                                                    }
                                                    type="radio"
                                                    name={`q-${index}`}
                                                    value={optionLetter}
                                                    checked={
                                                        answers[index] ===
                                                        optionLetter
                                                    }
                                                    onChange={() =>
                                                        handleAnswer(
                                                            index,
                                                            optionLetter
                                                        )
                                                    }
                                                />

                                                <span>
                                                    {optionLetter}) {option.text}
                                                </span>

                                            </label>

                                        );

                                    }
                                )}

                            </div>

                        </div>

                    )
                )}

                {/* -----------------------------------------
                    Submit
                ----------------------------------------- */}

                <button
                    type="button"
                    className="submit-btn"
                    onClick={() =>
                        submitQuiz(false)
                    }
                    disabled={submitting}
                >

                    {submitting
                        ? "Submitting..."
                        : "Submit Quiz"}

                </button>

            </div>

        </div>

    );

}

export default Quiz;