import React, { useEffect } from "react";

const DetailItem = ({ label, value }) => (
    <div className="space-y-1">
        <p className="text-sm text-gray-500">
            {label}
        </p>

        <p className="font-semibold text-gray-900 break-words">
            {value || "-"}
        </p>
    </div>
);

const TeacherProfileModal = ({
    teacher,
    onClose,
     onStatusChange,
     onDelete,
}) => {
    if (!teacher) return null;


    useEffect(() => {

        const handleEscape = (event) => {

            if (event.key === "Escape") {
                onClose();
            }

        };


        document.addEventListener(
            "keydown",
            handleEscape
        );


        // lock background scrolling
        document.body.style.overflow = "hidden";


        return () => {

            document.removeEventListener(
                "keydown",
                handleEscape
            );

            document.body.style.overflow = "auto";

        };


    }, [onClose]);


    if (!teacher) return null;

    return (

        <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
    onClick={onClose}
>

    <div
    className="
bg-white 
rounded-2xl 
shadow-2xl 
w-full 
max-w-4xl 
max-h-[90vh] 
overflow-hidden
animate-in
fade-in
zoom-in-95
duration-200
"
    onClick={(e) => e.stopPropagation()}
>



                {/* ================= Header ================= */}

                <div className="sticky top-0 bg-white border-b px-8 py-5 flex justify-between items-center">

                    <div>

                        <h2 className="text-2xl font-bold">
                            Teacher Profile
                        </h2>

                        <p className="text-gray-500 text-sm mt-1">
                            Complete teacher information
                        </p>

                    </div>

                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-lg hover:bg-gray-100 transition flex items-center justify-center text-2xl"
                    >
                        ✕
                    </button>

                </div>

                {/* ================= Body ================= */}

                <div className="overflow-y-auto max-h-[70vh] px-8 py-6">

                    {/* Profile */}

                    <div className="flex items-center gap-6 mb-8">

                        <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-bold shadow">

                            {teacher.name.charAt(0)}

                        </div>

                        <div>

                            <h3 className="text-3xl font-bold">

                                {teacher.name}

                            </h3>

                            <p className="text-gray-500 mt-1">

                                {teacher.email}

                            </p>

                        </div>

                    </div>

                    {/* Information */}

                    <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">

                        <DetailItem
                            label="Employee ID"
                            value={teacher.employee_id}
                        />

                        <DetailItem
                            label="Department"
                            value={teacher.department}
                        />

                        <DetailItem
                            label="Designation"
                            value={teacher.designation}
                        />

                        <DetailItem
                            label="Phone"
                            value={teacher.phone}
                        />

                        <div>

    <p className="text-sm text-gray-500">
        Status
    </p>

    <div className="flex items-center gap-3 mt-2 flex-wrap">

        <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                teacher.status === "Active"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
            }`}
        >
            {teacher.status}
        </span>


        <button
            onClick={() => onStatusChange(teacher)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                teacher.status === "Active"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-green-600 text-white hover:bg-green-700"
            }`}
        >

            {
                teacher.status === "Active"
                    ? "Deactivate"
                    : "Activate"
            }

        </button>
        <button
    onClick={() => onDelete(teacher)}
    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
>
    Delete Teacher
</button>
      


    </div>

</div>

                        <DetailItem
                            label="Created"
                            value={new Date(
                                teacher.created_at
                            ).toLocaleDateString()}
                        />

                    </div>

                    {/* Divider */}

                    <div className="border-t my-8"></div>

                    {/* Sections */}

                    <div className="mb-8">

                        <h3 className="font-semibold text-lg mb-4">

                            Assigned Sections

                        </h3>

                        <div className="flex flex-wrap gap-3">

                            {teacher.sections.length > 0 ? (

                                teacher.sections.map(section => (

                                    <span
                                        key={section}
                                        className="px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-medium"
                                    >

                                        {section}

                                    </span>

                                ))

                            ) : (

                                <p className="text-gray-400">

                                    No Sections Assigned

                                </p>

                            )}

                        </div>

                    </div>

                    {/* Subjects */}

                    <div>

                        <h3 className="font-semibold text-lg mb-4">

                            Assigned Subjects

                        </h3>

                        <div className="flex flex-wrap gap-3">

                            {teacher.subjects.length > 0 ? (

                                teacher.subjects.map(subject => (

                                    <span
                                        key={subject}
                                        className="px-4 py-2 rounded-full bg-green-100 text-green-700 font-medium"
                                    >

                                        {subject}

                                    </span>

                                ))

                            ) : (

                                <p className="text-gray-400">

                                    No Subjects Assigned

                                </p>

                            )}

                        </div>

                    </div>

                </div>

 

            </div>

        </div>

    );

};

export default TeacherProfileModal;