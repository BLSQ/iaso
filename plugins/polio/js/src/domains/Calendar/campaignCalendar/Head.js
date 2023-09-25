import React from 'react';

import classnames from 'classnames';
import PropTypes from 'prop-types';
import { TableHead, TableRow, TableCell, Typography } from '@material-ui/core';

import { useStyles } from './Styles';

import { colSpanTitle } from './constants';
import { HeadStaticFieldsCells } from './cells/HeadStaticFields';
import { useStaticFields } from '../hooks/useStaticFields';

const Head = ({ headers, orders, currentWeekIndex, isPdf }) => {
    const classes = useStyles();
    const fields = useStaticFields(isPdf);
    return (
        <TableHead>
            <TableRow className={classes.tableRow}>
                {fields.map(f => (
                    <TableCell
                        key={f.key}
                        className={classnames(
                            classes.tableCellTitle,
                            classes.tableCellTitleEmpty,
                        )}
                        colSpan={colSpanTitle}
                    />
                ))}
                {headers.years.map(year => (
                    <TableCell
                        className={classnames(
                            classes.tableCellHead,
                            classes.tableCellTopBordered,
                        )}
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
                {fields.map(f => (
                    <TableCell
                        key={f.key}
                        className={classnames(
                            classes.tableCellTitle,
                            classes.tableCellTitleEmpty,
                        )}
                        style={{ top: 50 }}
                        colSpan={colSpanTitle}
                    />
                ))}
                {headers.months.map(month => (
                    <TableCell
                        className={classnames(
                            classes.tableCellHead,
                            classes.tableCellSmall,
                        )}
                        style={{ top: 50 }}
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
                <HeadStaticFieldsCells orders={orders} isPdf={isPdf} />
                {headers.weeks.map((week, weekIndex) => (
                    <TableCell
                        className={classnames(
                            [classes.tableCellHead, classes.tableCellSmall],
                            {
                                [classes.currentWeek]:
                                    weekIndex + 1 === currentWeekIndex,
                            },
                        )}
                        style={{ top: 100 }}
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
                {fields.map(f => (
                    <TableCell
                        key={f.key}
                        className={classes.tableCellTitle}
                        colSpan={colSpanTitle}
                    />
                ))}
                {headers.weeks.map(week => {
                    return Array(7)
                        .fill()
                        .map((x, i) => (
                            <TableCell
                                className={classnames([
                                    classes.tableCellHead,
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
    orders: PropTypes.string.isRequired,
    currentWeekIndex: PropTypes.number.isRequired,
    isPdf: PropTypes.bool.isRequired,
};

export { Head };
