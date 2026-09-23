import TeacherRow from "./TeacherRow";

const TeacherTable = ({
    teachers,
    onView,
    onAssignSections,
}) => {

    return (

        <div className="overflow-x-auto bg-white rounded-xl shadow">

            <table className="min-w-full">

                <thead className="bg-gray-100">

                    <tr>

                        <th className="px-6 py-4 text-left">
                            Teacher
                        </th>

                        <th className="px-6 py-4 text-left">
                            Employee ID
                        </th>

                        <th className="px-6 py-4 text-left">
                            Department
                        </th>

                        <th className="px-6 py-4 text-left">
                            Designation
                        </th>

                        <th className="px-6 py-4 text-left">
                            Sections
                        </th>

                        <th className="px-6 py-4 text-left">
                            Status
                        </th>

                        <th className="px-6 py-4 text-center">
                            Actions
                        </th>

                    </tr>

                </thead>

                <tbody>

                    {teachers.map((teacher) => (

                        <TeacherRow
                            key={teacher.id}
                            teacher={teacher}
                            onView={onView}
                            onAssignSections={onAssignSections}
                        />

                    ))}

                </tbody>

            </table>

        </div>

    );

};

export default TeacherTable;