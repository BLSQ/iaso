import React from 'react';
import { PageRowSelect } from 'bluesquare-components';
import { arrayOf, number, func } from 'prop-types';

const ROWS_PER_PAGE_OPTIONS = [5, 10, 20, 30, 40, 50];

export const TreeViewResultsCountSelect = ({
    resultsCount,
    handleSelect,
    countOptions,
}) => {
    return (
        <PageRowSelect
            rowsPerPageOptions={countOptions}
            rowsPerPage={resultsCount}
            selectRowsPerPage={handleSelect}
        />
    );
};

TreeViewResultsCountSelect.propTypes = {
    countOptions: arrayOf(number),
    resultsCount: number,
    handleSelect: func,
};

TreeViewResultsCountSelect.defaultProps = {
    countOptions: ROWS_PER_PAGE_OPTIONS,
    handleSelect: () => null,
    resultsCount: ROWS_PER_PAGE_OPTIONS[2],
};
