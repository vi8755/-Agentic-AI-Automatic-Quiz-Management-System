function ReportSummary({ reports }) {

    const totalAttempts = reports.length;

    const percentages = reports.map(r => r.percentage);

    const average =
        totalAttempts === 0
            ? 0
            : (
                percentages.reduce((a, b) => a + b, 0)
                / totalAttempts
            ).toFixed(1);

    const highest =
        totalAttempts === 0
            ? 0
            : Math.max(...percentages);

    const lowest =
        totalAttempts === 0
            ? 0
            : Math.min(...percentages);

    const passed = reports.filter(
    (report) => report.percentage >= 40
).length;

const failed = totalAttempts - passed;

const passRate =
    totalAttempts === 0
        ? 0
        : ((passed / totalAttempts) * 100).toFixed(1);

const cards = [
    {
        title: "Attempts",
        value: totalAttempts,
    },
    {
        title: "Average",
        value: `${average}%`,
    },
    {
        title: "Highest",
        value: `${highest}%`,
    },
    {
        title: "Lowest",
        value: `${lowest}%`,
    },
    {
        title: "Passed",
        value: passed,
    },
    {
        title: "Failed",
        value: failed,
    },
    {
        title: "Pass Rate",
        value: `${passRate}%`,
    },
];

    return (

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 mb-8">

            {cards.map(card => (

                <div
                    key={card.title}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 p-6"
                >

                    <h3 className="text-gray-500 text-sm">
                        {card.title}
                    </h3>

                    <p className="text-3xl font-bold mt-3">
                        {card.value}
                    </p>

                </div>

            ))}

        </div>

    );

}

export default ReportSummary;