import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import Box from '@material-ui/core/Box';
import FirstPageIcon from '@material-ui/icons/FirstPage';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import LastPageIcon from '@material-ui/icons/LastPage';
import { useSafeIntl } from 'bluesquare-components';

import { PageSelect } from './PageSelect';
import { PageRowSelect } from './PageRowSelect';
import { Count } from './Count';

import { MESSAGES } from '../messages';

const useStyles = makeStyles(theme => ({
    root: {
        width: '100%',
        position: 'relative',
    },
    count: {
        position: 'absolute',
        right: theme.spacing(2),
    },
}));

const TablePaginationActions = ({
    count,
    pageIndex,
    rowsPerPage,
    onPageChange,
    pages,
    rowsPerPageOptions,
    onRowPerPageChange,
    countOnTop,
    selectCount,
}) => {
    const classes = useStyles();

    const intl = useSafeIntl();
    const { formatMessage } = intl;
    const handleFirstPageButtonClick = () => {
        onPageChange(1);
    };

    const handleBackButtonClick = () => {
        onPageChange(pageIndex);
    };

    const handleNextButtonClick = () => {
        onPageChange(pageIndex + 2);
    };

    const handleLastPageButtonClick = () => {
        onPageChange(Math.max(0, Math.ceil(count / rowsPerPage)));
    };

    const firstDisabled = pageIndex === 0;
    const lastDisabled = pageIndex >= Math.ceil(count / rowsPerPage) - 1;

    return (
        <Box
            py={2}
            display="flex"
            justifyContent="center"
            alignItems="center"
            className={classes.root}
        >
            <IconButton
                variant="outlined"
                onClick={handleFirstPageButtonClick}
                disabled={firstDisabled}
                aria-label={formatMessage(MESSAGES.firstText)}
            >
                <FirstPageIcon color={firstDisabled ? 'default' : 'primary'} />
            </IconButton>
            <IconButton
                variant="outlined"
                onClick={handleBackButtonClick}
                disabled={firstDisabled}
                aria-label={formatMessage(MESSAGES.previous)}
            >
                <KeyboardArrowLeft
                    color={firstDisabled ? 'default' : 'primary'}
                />
            </IconButton>
            <PageSelect
                pages={pages}
                pageIndex={pageIndex + 1}
                onPageChange={newPage => {
                    onPageChange(newPage);
                }}
            />
            <PageRowSelect
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={rowsPerPageOptions}
                onRowPerPageChange={onRowPerPageChange}
            />
            <IconButton
                variant="outlined"
                onClick={handleNextButtonClick}
                disabled={lastDisabled}
                aria-label={formatMessage(MESSAGES.next)}
            >
                <KeyboardArrowRight
                    color={lastDisabled ? 'inherit' : 'primary'}
                />
            </IconButton>
            <IconButton
                variant="outlined"
                onClick={handleLastPageButtonClick}
                disabled={lastDisabled}
                aria-label={formatMessage(MESSAGES.lastText)}
            >
                <LastPageIcon color={lastDisabled ? 'inherit' : 'primary'} />
            </IconButton>
            {!countOnTop && (
                <div className={classes.count}>
                    <Count count={count} selectCount={selectCount} />
                </div>
            )}
        </Box>
    );
};

TablePaginationActions.propTypes = {
    pages: PropTypes.number.isRequired,
    count: PropTypes.number.isRequired,
    onPageChange: PropTypes.func.isRequired,
    pageIndex: PropTypes.number.isRequired,
    rowsPerPage: PropTypes.number.isRequired,
    rowsPerPageOptions: PropTypes.array.isRequired,
    onRowPerPageChange: PropTypes.func.isRequired,
    countOnTop: PropTypes.bool.isRequired,
    selectCount: PropTypes.number.isRequired,
};

export { TablePaginationActions };
