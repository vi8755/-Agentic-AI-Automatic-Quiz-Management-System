const DashboardCard = ({
    title,
    value,
    icon: Icon,
    bgColor,
    iconColor,
}) => {
    return (
        <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
            <div className="flex items-center justify-between">

                <div>
                    <p className="text-gray-500 text-sm font-medium">
                        {title}
                    </p>

                    <h2 className="text-4xl font-bold mt-3 text-gray-800">
                        {value}
                    </h2>
                </div>

                <div
                    className={`w-14 h-14 rounded-xl ${bgColor} flex items-center justify-center`}
                >
                    <Icon
                        className={`text-3xl ${iconColor}`}
                    />
                </div>

            </div>
        </div>
    );
};

export default DashboardCard;