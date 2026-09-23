export default function CollegeOverview({ stats }) {

    const items = [
        {
            label: "Teachers",
            value: stats?.total_teachers ?? 0,
            max: 10,
            color: "bg-blue-500",
        },
        {
            label: "Students",
            value: stats?.total_students ?? 0,
            max: 20,
            color: "bg-green-500",
        },
        {
            label: "Sections",
            value: stats?.total_sections ?? 0,
            max: 10,
            color: "bg-yellow-500",
        },
        {
            label: "Quizzes",
            value: stats?.total_quizzes ?? 0,
            max: 20,
            color: "bg-purple-500",
        },
        {
            label: "Attempts",
            value: stats?.total_attempts ?? 0,
            max: 20,
            color: "bg-red-500",
        },
    ];

    return (
        <div className="bg-white rounded-2xl shadow-md p-6">

            <div className="flex justify-between items-center mb-8">

                <h2 className="text-xl font-bold">
                    College Overview
                </h2>

                <span className="text-gray-500 text-sm">
                    Overall Progress
                </span>

            </div>

            <div className="space-y-6">

                {items.map((item) => {

                    const percent = Math.min(
                        (item.value / item.max) * 100,
                        100
                    );

                    return (

                        <div key={item.label}>

                            <div className="flex justify-between mb-2">

                                <span className="font-medium">

                                    {item.label}

                                </span>

                                <span className="font-semibold">

                                    {item.value}

                                </span>

                            </div>

                            <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">

                                <div
                                    className={`${item.color} h-3 rounded-full transition-all duration-700`}
                                    style={{
                                        width: `${percent}%`,
                                    }}
                                />

                            </div>

                        </div>

                    );

                })}

            </div>

        </div>
    );
}