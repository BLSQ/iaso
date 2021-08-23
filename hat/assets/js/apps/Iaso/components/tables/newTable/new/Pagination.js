import React from 'react';
import PropTypes from 'prop-types';
import TablePagination from '@material-ui/core/TablePagination';
import { makeStyles } from '@material-ui/core/styles';
import { useSafeIntl } from 'bluesquare-components';

import { MESSAGES } from '../messages';
import { ROWS_PER_PAGE_OPTIONS } from './constants';
import { TablePaginationActions } from './TablePaginationActions';

const useStyles = makeStyles(() => ({
    spacer: {
        display: 'none',
    },
    caption: {
        display: 'none',
    },
    input: {
        display: 'none',
    },
}));
const Pagination = ({
    data,
    count,
    rowsPerPage,
    pageIndex,
    onTableParamsChange,
    pages,
    countOnTop,
    selectCount,
}) => {
    const classes = useStyles();
    const intl = useSafeIntl();
    const { formatMessage } = intl;
    if (data && data.length > 0) {
        return (
            <TablePagination
                classes={{
                    spacer: classes.spacer,
                    caption: classes.caption,
                    input: classes.input,
                }}
                rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                component="div"
                count={count}
                rowsPerPage={rowsPerPage}
                page={pageIndex}
                onPageChange={(event, newPage) => {
                    onTableParamsChange('page', newPage + 1);
                }}
                onRowsPerPageChange={event => {
                    onTableParamsChange('pageSize', event.target.value);
                }}
                nextIconButtonText={formatMessage(MESSAGES.next)}
                backIconButtonText={formatMessage(MESSAGES.previousText)}
                ActionsComponent={() => (
                    <TablePaginationActions
                        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                        count={count}
                        rowsPerPage={rowsPerPage}
                        onPageChange={value =>
                            onTableParamsChange('page', value)
                        }
                        onRowPerPageChange={value =>
                            onTableParamsChange('pageSize', value)
                        }
                        pageIndex={pageIndex}
                        pages={pages}
                        countOnTop={countOnTop}
                        selectCount={selectCount}
                    />
                )}
                labelDisplayedRows={() => null}
            />
        );
    }
    return null;
};
Pagination.defaultProps = {
    data: [],
    count: 0,
    rowsPerPage: 0,
    pageIndex: 0,
    pages: 0,
    selectCount: 0,
};

Pagination.propTypes = {
    count: PropTypes.number,
    rowsPerPage: PropTypes.number,
    pageIndex: PropTypes.number,
    pages: PropTypes.number,
    data: PropTypes.array,
    onTableParamsChange: PropTypes.func.isRequired,
    countOnTop: PropTypes.bool.isRequired,
    selectCount: PropTypes.number,
};

export { Pagination };
