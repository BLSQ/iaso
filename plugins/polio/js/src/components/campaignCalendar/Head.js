import React from 'react';

import classnames from 'classnames';
import PropTypes from 'prop-types';

import { TableHead, TableRow, TableCell, Typography } from '@material-ui/core';

import { useStyles } from './Styles';

const Head = ({ headers }) => {
    const classes = useStyles();
    return (
        <TableHead>
            <TableRow className={classes.tableRow}>
                {headers.years.map(year => (
                    <TableCell
                        className={classes.tableCell}
                        key={`year-${year.value}`}
                        align="center"
                        colSpan={year.daysCount}
                    >
                        <Typography variant="h5">{year.value}</Typography>
                    </TableCell>
                ))}
            </TableRow>
            <TableRow
                className={classnames(classes.tableRow, classes.tableRowSmall)}
            >
                {headers.months.map(month => (
                    <TableCell
                        className={classnames(
                            classes.tableCell,
                            classes.tableCellSmall,
                        )}
                        key={`month-${month.year}-${month.value}`}
                        align="center"
                        colSpan={month.daysCount}
                    >
                        {month.value}
                    </TableCell>
                ))}
            </TableRow>
            <TableRow
                className={classnames(classes.tableRow, classes.tableRowSmall)}
            >
                {headers.weeks.map(week => (
                    <TableCell
                        className={classnames([
                            classes.tableCell,
                            classes.tableCellSmall,
                            classes.tableCellFixed,
                        ])}
                        key={`month-${week.year}-${week.month}-${week.value}`}
                        align="center"
                        colSpan={7}
                    >
                        {week.value}
                    </TableCell>
                ))}
            </TableRow>
        </TableHead>
    );
};

Head.propTypes = {
    headers: PropTypes.object.isRequired,
};

export { Head };
