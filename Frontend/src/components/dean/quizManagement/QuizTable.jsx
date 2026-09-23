import {
    ClipboardList,
    Eye,
    MoreVertical,
    Users,
} from "lucide-react";

import QuizActions from "./QuizActions";

const QuizTable = ({
    quizzes = [],
    loading = false,
    onRefresh,
     onView,
}) => {

    // =====================================================
    // Loading
    // =====================================================

    if (loading) {

        return (

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="flex h-64 items-center justify-center">

                    <div className="flex flex-col items-center gap-3">

                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                        <p className="text-sm text-slate-500">
                            Loading quizzes...
                        </p>

                    </div>

                </div>

            </div>

        );

    }


    // =====================================================
    // Empty
    // =====================================================

    if (!quizzes.length) {

        return (

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">

                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">

                        <ClipboardList
                            size={27}
                        />

                    </div>

                    <h3 className="mt-4 text-base font-semibold text-slate-800">
                        No quizzes found
                    </h3>

                    <p className="mt-1 max-w-sm text-sm text-slate-500">
                        There are no quizzes matching
                        the current search or filter.
                    </p>

                </div>

            </div>

        );

    }


    // =====================================================
    // Render
    // =====================================================

    return (

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            {/* =================================================
                Desktop Table
            ================================================= */}

            <div className="overflow-x-auto">

                <table className="w-full min-w-[1050px]">

                    <thead>

                        <tr className="border-b border-slate-200 bg-slate-50">

                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Quiz
                            </th>

                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Teacher
                            </th>

                            <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Questions
                            </th>

                            <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Marks
                            </th>

                            <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Assignments
                            </th>

                            <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Attempts
                            </th>

                            <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Status
                            </th>

                            <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Actions
                            </th>

                        </tr>

                    </thead>


                    <tbody className="divide-y divide-slate-100">

                        {quizzes.map((quiz) => (

                            <tr
                                key={quiz.id}
                                className="transition hover:bg-slate-50"
                            >

                                {/* =================================================
                                    Quiz
                                ================================================= */}

                                <td className="px-5 py-4">

                                    <div className="flex items-center gap-3">

                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">

                                            <ClipboardList
                                                size={19}
                                            />

                                        </div>

                                        <div className="min-w-0">

                                            <p className="truncate font-semibold text-slate-800">

                                                {quiz.title ||
                                                    "Untitled Quiz"}

                                            </p>

                                            <p className="mt-0.5 text-xs text-slate-400">

                                                Quiz #{quiz.id}

                                            </p>

                                        </div>

                                    </div>

                                </td>


                                {/* =================================================
                                    Teacher
                                ================================================= */}

                                <td className="px-5 py-4">

                                    <div>

                                        <p className="font-medium text-slate-700">

                                            {quiz.teacher_name ||
                                                "—"}

                                        </p>

                                        {quiz.teacher_email && (

                                            <p className="mt-0.5 text-xs text-slate-400">

                                                {quiz.teacher_email}

                                            </p>

                                        )}

                                    </div>

                                </td>


                                {/* =================================================
                                    Questions
                                ================================================= */}

                                <td className="px-5 py-4 text-center">

                                    <span className="font-semibold text-slate-700">

                                        {quiz.total_questions ??
                                            0}

                                    </span>

                                </td>


                                {/* =================================================
                                    Marks
                                ================================================= */}

                                <td className="px-5 py-4 text-center">

                                    <span className="font-semibold text-slate-700">

                                        {quiz.total_marks ??
                                            0}

                                    </span>

                                </td>


                                {/* =================================================
                                    Assignments
                                ================================================= */}

                                <td className="px-5 py-4 text-center">

                                    <div className="inline-flex items-center gap-1.5 text-slate-600">

                                        <Users
                                            size={15}
                                        />

                                        <span className="font-medium">

                                            {quiz.assignment_count ??
                                                0}

                                        </span>

                                    </div>

                                </td>


                                {/* =================================================
                                    Attempts
                                ================================================= */}

                                <td className="px-5 py-4 text-center">

                                    <span className="font-semibold text-slate-700">

                                        {quiz.attempt_count ??
                                            0}

                                    </span>

                                </td>


                                {/* =================================================
                                    Status
                                ================================================= */}

                                <td className="px-5 py-4 text-center">

                                    <StatusBadge
                                        status={
                                            quiz.status
                                        }
                                    />

                                </td>


                                {/* =================================================
                                    Actions
                                ================================================= */}

                                <td className="px-5 py-4">

                                    <div className="flex justify-end">

                                        <QuizActions
                                            quiz={quiz}
                                            onRefresh={
                                                onRefresh
                                            }
                                              onView={onView}
                                            

                                        />

                                    </div>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

        </div>

    );

};


// =====================================================
// Status Badge
// =====================================================

const StatusBadge = ({
    status,
}) => {

    const normalizedStatus =
        status?.toLowerCase();


    if (
        normalizedStatus ===
        "published"
    ) {

        return (

            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">

                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                Published

            </span>

        );

    }


    if (
        normalizedStatus ===
        "draft"
    ) {

        return (

            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">

                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

                Draft

            </span>

        );

    }


    return (

        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">

            {status || "Unknown"}

        </span>

    );

};

export default QuizTable;