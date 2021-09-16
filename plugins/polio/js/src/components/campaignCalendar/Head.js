import React from 'react';

import classnames from 'classnames';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { TableHead, TableRow, TableCell, Typography } from '@material-ui/core';

import { useStyles } from './Styles';

import { colSpanTitle } from './constants';

const Head = ({ headers }) => {
    const classes = useStyles();
    return (
        <TableHead>
            <TableRow className={classes.tableRow}>
                <TableCell
                    className={classes.tableCellTitle}
                    align="left"
                    colSpan={colSpanTitle}
                />
                {headers.years.map(year => (
                    <TableCell
                        className={classes.tableCell}
                        key={`year-${year.value}`}
                        align="center"
                        colSpan={year.daysCount}
                    >
                        <Typography
                            className={classes.tableCellSpan}
                            variant="h5"
                        >
                            {year.value}
                        </Typography>
                    </TableCell>
                ))}
            </TableRow>
            <TableRow
                className={classnames(classes.tableRow, classes.tableRowSmall)}
            >
                <TableCell
                    className={classes.tableCellTitle}
                    align="left"
                    colSpan={colSpanTitle}
                />
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
                        <span className={classes.tableCellSpan}>
                            {month.value}
                        </span>
                    </TableCell>
                ))}
            </TableRow>
            <TableRow
                className={classnames(classes.tableRow, classes.tableRowSmall)}
            >
                <TableCell
                    className={classes.tableCellTitle}
                    align="left"
                    colSpan={colSpanTitle}
                >
                    <span
                        className={classnames(
                            classes.tableCellSpan,
                            classes.tableCellSpanTitle,
                        )}
                    >
                        <FormattedMessage
                            id="iaso.polio.calendar.obrName"
                            defaultMessage="Name"
                        />
                    </span>
                </TableCell>
                {headers.weeks.map(week => (
                    <TableCell
                        className={classnames([
                            classes.tableCell,
                            classes.tableCellSmall,
                        ])}
                        key={`week-${week.year}-${week.month}-${week.value}`}
                        align="center"
                        colSpan={7}
                    >
                        <span className={classes.tableCellSpan}>
                            {week.value}
                        </span>
                    </TableCell>
                ))}
            </TableRow>
            <TableRow
                className={classnames(classes.tableRow, classes.tableRowHidden)}
            >
                <TableCell
                    className={classes.tableCellTitle}
                    align="left"
                    colSpan={colSpanTitle}
                />
                {headers.weeks.map(week => {
                    return Array(7)
                        .fill()
                        .map((x, i) => (
                            <TableCell
                                className={classnames([
                                    classes.tableCell,
                                    classes.tableCellHidden,
                                ])}
                                key={`day-${week.year}-${week.month}-${week.value}-${i}`}
                                align="center"
                                colSpan={1}
                            />
                        ));
                })}
            </TableRow>
        </TableHead>
    );
};

Head.propTypes = {
    headers: PropTypes.object.isRequired,
};

export { Head };
