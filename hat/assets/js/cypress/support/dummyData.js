export const makePaginatedResponse = ({
    hasPrevious,
    hasNext,
    count,
    page,
    pages,
    limit,
    dataKey,
    data,
}) => {
    return {
        hasPrevious,
        hasNext,
        count,
        page,
        pages,
        limit,
        [dataKey]: data,
    };
};
