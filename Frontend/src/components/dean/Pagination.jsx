const Pagination = ({
    page,
    totalPages,
    setPage,
}) => {

    return (

        <div className="flex justify-end items-center gap-3 mt-6">

            <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-4 py-2 rounded border disabled:opacity-50"
            >
                Previous
            </button>

            <span>

                Page {page} of {totalPages}

            </span>

            <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-4 py-2 rounded border disabled:opacity-50"
            >
                Next
            </button>

        </div>

    );

};

export default Pagination;