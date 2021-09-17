import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';

import { TableRow, TableCell, TableBody } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';

import { useStyles } from './Styles';

import { colsCount, colSpanTitle } from './constants';

import MESSAGES from '../../constants/messages';
import { filterCampaigns } from './utils';

const Body = ({ campaigns, currentWeekIndex, firstMonday, lastSunday }) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const defaultCellStyles = [classes.tableCell, classes.tableCellBordered];
    const filteredCampaigns = filterCampaigns(
        campaigns,
        firstMonday,
        lastSunday,
    );
    return (
        <TableBody>
            {campaigns.map(campaign => {
                const cells = [];
                const { R1Start, R1End, R2Start, R2End, campaignDays, id } =
                    campaign;
                const emptyCell = (uKey, colSpan, isCurrentWeek = false) => (
                    <TableCell
                        colSpan={colSpan}
                        className={classnames(defaultCellStyles, {
                            [classes.currentWeek]: isCurrentWeek,
                        })}
                        key={`empty-cell-${id}-${uKey}`}
                    />
                );
                const campaingDurationCell = (uKey, colSpan, hasR2) => (
                    <TableCell
                        key={`campaign-duration-${uKey}`}
                        className={classnames(
                            defaultCellStyles,
                            classes.campaign,
                            {
                                [classes.tableCellDashed]: !hasR2,
                            },
                        )}
                        colSpan={colSpan}
                    >
                        {colSpan > 5 && (
                            <span className={classes.tableCellSpan}>
                                {`${campaign.campaignWeeks} ${formatMessage(
                                    MESSAGES.weeks,
                                )}`}
                            </span>
                        )}
                    </TableCell>
                );
                const r1Cell = (uKey, colSpan) => (
                    <TableCell
                        key={`r1-campaign-${uKey}`}
                        className={classnames(defaultCellStyles, classes.round)}
                        colSpan={colSpan}
                    >
                        {colSpan > 1 && (
                            <span className={classes.tableCellSpan}>R1</span>
                        )}
                    </TableCell>
                );
                const r2Cell = (uKey, colSpan) => (
                    <TableCell
                        key={`r2-campaign-${uKey}`}
                        className={classnames(
                            defaultCellStyles,
                            classes.round,
                            classes.round2,
                        )}
                        colSpan={colSpan}
                    >
                        {colSpan > 1 && (
                            <span className={classes.tableCellSpan}>R2</span>
                        )}
                    </TableCell>
                );
                let colSpan;
                if (R1Start && R1End) {
                    if (
                        R1Start.isSameOrAfter(firstMonday, 'day') &&
                        R1Start.isSameOrBefore(lastSunday, 'day')
                    ) {
                        if (!R1Start.isSame(firstMonday, 'day')) {
                            let monday;
                            if (R1Start.weekday() !== 1) {
                                monday = R1Start.clone().startOf('isoWeek');
                            } else {
                                monday = R1Start.clone();
                            }
                            const extraDays = R1Start.clone().diff(
                                monday,
                                'days',
                            );
                            const fullWeeks = monday.diff(firstMonday, 'weeks');

                            Array(fullWeeks)
                                .fill()
                                .forEach((_, i) => {
                                    cells.push(
                                        emptyCell(
                                            `${id}-start-${i}`,
                                            7,
                                            cells.length + 1 ===
                                                currentWeekIndex,
                                        ),
                                    );
                                });
                            if (extraDays) {
                                cells.push(
                                    emptyCell(
                                        `${id}-${R1Start}`,
                                        extraDays,
                                        cells.length + 1 === currentWeekIndex,
                                    ),
                                );
                            }
                        }

                        colSpan = R1End.clone()
                            .add(1, 'day')
                            .diff(R1Start, 'days');
                        cells.push(r1Cell(id, colSpan));
                        if (!R1End.isAfter(lastSunday)) {
                            const availableDays = lastSunday.diff(
                                R1End,
                                'days',
                            );
                            cells.push(
                                campaingDurationCell(
                                    id,
                                    campaignDays - 1 > availableDays
                                        ? availableDays
                                        : campaignDays - 1,
                                    Boolean(R2Start),
                                ),
                            );
                        }
                    } else if (
                        R1End.isSameOrAfter(firstMonday, 'day') &&
                        R1End.isSameOrBefore(lastSunday, 'day')
                    ) {
                        colSpan = R1End.clone()
                            .add(1, 'day')
                            .diff(firstMonday, 'days');
                        cells.push(r1Cell(id, colSpan));
                        const availableDays = lastSunday.diff(R1End, 'days');
                        cells.push(
                            campaingDurationCell(
                                id,
                                campaignDays - 1 > availableDays
                                    ? availableDays
                                    : campaignDays - 1,
                                Boolean(R2Start),
                            ),
                        );
                    } else if (
                        R1End.isBefore(firstMonday, 'day') &&
                        firstMonday.diff(R1End, 'days') < campaignDays
                    ) {
                        colSpan =
                            campaignDays - firstMonday.diff(R1End, 'days');
                        cells.push(
                            campaingDurationCell(id, colSpan, Boolean(R2Start)),
                        );
                    }

                    if (R2Start && R2End) {
                        if (
                            R2Start.isSameOrAfter(firstMonday, 'day') &&
                            R2Start.isSameOrBefore(lastSunday, 'day')
                        ) {
                            colSpan = R2End.clone()
                                .add(1, 'day')
                                .diff(R2Start, 'days');
                            cells.push(r2Cell(id, colSpan));
                        } else if (
                            R2End.isSameOrAfter(firstMonday, 'day') &&
                            R2End.isSameOrBefore(lastSunday, 'day')
                        ) {
                            colSpan = R2End.clone()
                                .add(1, 'day')
                                .diff(firstMonday, 'days');
                            cells.push(r2Cell(id, colSpan));
                        }

                        if (
                            R2End.isSameOrAfter(firstMonday, 'day') &&
                            R2End.isSameOrBefore(lastSunday, 'day')
                        ) {
                            let sunday;
                            if (R2End.weekday() !== 7) {
                                sunday = R2End.clone().endOf('isoWeek');
                            } else {
                                sunday = R2End.clone();
                            }
                            const extraDays = sunday.diff(R2End, 'days');
                            const fullWeeks = lastSunday.diff(sunday, 'weeks');

                            let spans = 0;
                            cells.forEach(c => {
                                spans += c.props.colSpan;
                            });
                            spans = parseInt(spans / 7, 10);
                            if (extraDays) {
                                spans += 1;
                                cells.push(
                                    emptyCell(
                                        `${id}-${R2End}`,
                                        extraDays,
                                        spans === currentWeekIndex,
                                    ),
                                );
                            }
                            Array(fullWeeks)
                                .fill()
                                .forEach((_, i) => {
                                    spans += 1;
                                    cells.push(
                                        emptyCell(
                                            `${id}-end-${i}`,
                                            7,
                                            spans === currentWeekIndex,
                                        ),
                                    );
                                });
                        }
                    }
                    if (!R2Start && cells.length > 0) {
                        let sunday;
                        const fakeR2End = R1End.clone().add(
                            campaignDays,
                            'days',
                        );
                        if (!fakeR2End.isAfter(lastSunday)) {
                            if (fakeR2End.weekday() !== 7) {
                                sunday = fakeR2End.clone().endOf('isoWeek');
                            } else {
                                sunday = fakeR2End.clone();
                            }
                            const extraDays = sunday
                                .clone()
                                .add(1, 'day')
                                .diff(fakeR2End, 'days');
                            const fullWeeks = lastSunday.diff(sunday, 'weeks');

                            let spans = 0;
                            cells.forEach(c => {
                                spans += c.props.colSpan;
                            });
                            spans = parseInt(spans / 7, 10);
                            if (extraDays) {
                                spans += 1;
                                cells.push(
                                    emptyCell(
                                        `${id}-${R2End}`,
                                        extraDays,
                                        spans === currentWeekIndex,
                                    ),
                                );
                            }
                            Array(fullWeeks)
                                .fill()
                                .forEach((_, i) => {
                                    spans += 1;
                                    cells.push(
                                        emptyCell(
                                            `${id}-end-${i}`,
                                            7,
                                            spans === currentWeekIndex,
                                        ),
                                    );
                                });
                        }
                    }
                }
                if (cells.length === 0) {
                    Array(colsCount)
                        .fill()
                        .forEach((_, i) => {
                            cells.push(
                                emptyCell(
                                    `${id}-${i}`,
                                    7,
                                    i + 1 === currentWeekIndex,
                                ),
                            );
                        });
                }
                return (
                    <TableRow className={classes.tableRow} key={`row-${id}}`}>
                        <TableCell
                            colSpan={colSpanTitle}
                            className={classnames(defaultCellStyles)}
                        >
                            <span
                                className={classnames(
                                    classes.tableCellSpan,
                                    classes.tableCellSpanRow,
                                )}
                            >
                                {campaign.country}
                            </span>
                        </TableCell>
                        <TableCell
                            colSpan={colSpanTitle}
                            className={classnames(defaultCellStyles)}
                        >
                            <span
                                className={classnames(
                                    classes.tableCellSpan,
                                    classes.tableCellSpanRow,
                                )}
                            >
                                {campaign.name}
                            </span>
                        </TableCell>
                        <TableCell
                            colSpan={colSpanTitle}
                            className={classnames(defaultCellStyles)}
                        >
                            <span
                                className={classnames(
                                    classes.tableCellSpan,
                                    classes.tableCellSpanRow,
                                )}
                            >
                                {campaign.R1Start
                                    ? campaign.R1Start.format('L')
                                    : ''}
                            </span>
                        </TableCell>
                        {cells}
                    </TableRow>
                );
            })}
        </TableBody>
    );
};

Body.propTypes = {
    campaigns: PropTypes.array.isRequired,
    currentWeekIndex: PropTypes.number.isRequired,
    firstMonday: PropTypes.object.isRequired,
    lastSunday: PropTypes.object.isRequired,
};

export { Body };
