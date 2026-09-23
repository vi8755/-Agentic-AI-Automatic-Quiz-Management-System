const EmptyState = ({
    title = "No teachers found",
    message = "Try changing your search or filter criteria.",
    buttonText,
    onButtonClick,
}) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">

            <div className="text-6xl mb-4">
                👨‍🏫
            </div>

            <h2 className="text-2xl font-bold text-gray-800">
                {title}
            </h2>

            <p className="text-gray-500 mt-2">
                {message}
            </p>

            {buttonText && (
                <button
                    onClick={onButtonClick}
                    className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    {buttonText}
                </button>
            )}

        </div>
    );
};

export default EmptyState;