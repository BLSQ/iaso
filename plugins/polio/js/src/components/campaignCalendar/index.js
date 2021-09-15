import React, { useMemo } from 'react';
import moment from 'moment';

import classnames from 'classnames';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';

import {
    Table,
    TableContainer,
    TableHead,
    TableRow,
    TableCell,
    Box,
    TableBody,
    Typography,
    IconButton,
} from '@material-ui/core';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import ChevronRight from '@material-ui/icons/ChevronRight';

import { redirectToReplace } from '../../../../../../hat/assets/js/apps/Iaso/routing/actions';

import { useStyles } from './Styles';

import { getCalendarData } from './utils';

const colsCount = 16;
const baseUrl = 'polio/calendar';

const CampaignsCalendar = ({ campaigns, params }) => {
    const classes = useStyles();
    const dispatch = useDispatch();
    const defaultCellStyles = [
        classes.tableCell,
        classes.tableCellBordered,
        classes.tableCellFixed,
    ];
    const currentDate = params.currentDate
        ? moment(params.currentDate, 'YYYY-MM-DD')
        : moment();

    const currentMonday = currentDate.clone().startOf('isoWeek');
    const { headers, currentWeekIndex } = useMemo(
        () => getCalendarData(colsCount, currentDate),
        [currentDate],
    );

    const handleGoNext = () => {
        const newDate = currentMonday.clone().add(4, 'week');
        dispatch(
            redirectToReplace(baseUrl, {
                currentDate: newDate.format('YYYY-MM-DD'),
            }),
        );
    };
    const handleGoPrev = () => {
        const newDate = currentMonday.clone().subtract(4, 'week');
        dispatch(
            redirectToReplace(baseUrl, {
                currentDate: newDate.format('YYYY-MM-DD'),
            }),
        );
    };

    return (
        <Box mb={2} mt={2} display="flex" alignItems="center">
            <IconButton onClick={handleGoPrev}>
                <ChevronLeft color="primary" />
            </IconButton>
            <TableContainer className={classes.tableContainer}>
                <Table>
                    <TableHead>
                        <TableRow className={classes.tableRow}>
                            {headers.years.map(year => (
                                <TableCell
                                    className={classes.tableCell}
                                    key={`year-${year}`}
                                    align="center"
                                    colSpan={colsCount / headers.years.length}
                                >
                                    <Typography variant="h5">{year}</Typography>
                                </TableCell>
                            ))}
                        </TableRow>
                        <TableRow
                            className={classnames(
                                classes.tableRow,
                                classes.tableRowSmall,
                            )}
                        >
                            {headers.months.map(month => (
                                <TableCell
                                    className={classnames(
                                        classes.tableCell,
                                        classes.tableCellSmall,
                                    )}
                                    key={`month-${month.year}-${month.value}`}
                                    align="center"
                                    colSpan={colsCount / headers.months.length}
                                >
                                    {month.value}
                                </TableCell>
                            ))}
                        </TableRow>
                        <TableRow
                            className={classnames(
                                classes.tableRow,
                                classes.tableRowSmall,
                            )}
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
                                >
                                    {week.value}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {campaigns.map(campaign => {
                            let cells = [];
                            const firstR1WeekIndex = campaign.r1WeekIndex[0];
                            const lastR2WeekIndex =
                                campaign.r2WeekIndex &&
                                campaign.r2WeekIndex[
                                    campaign.r2WeekIndex.length - 1
                                ];
                            let count = 0;
                            if (firstR1WeekIndex && firstR1WeekIndex > 1) {
                                cells = Array(firstR1WeekIndex - 1)
                                    .fill()
                                    .map((_, i) => (
                                        <TableCell
                                            className={classnames(
                                                defaultCellStyles,
                                                {
                                                    [classes.currentWeek]:
                                                        i ===
                                                        currentWeekIndex - 1,
                                                },
                                            )}
                                            align="center"
                                            key={`cell-${campaign.id}-${
                                                count + i + 1
                                            }`}
                                        />
                                    ));
                                count = firstR1WeekIndex - 1;
                            }
                            if (firstR1WeekIndex) {
                                count += 1;
                                cells.push(
                                    <TableCell
                                        key={`r1-campaign-${campaign.id}`}
                                        className={classnames(
                                            defaultCellStyles,
                                            classes.round,
                                        )}
                                        colSpan={campaign.r1WeekIndex.length}
                                        align="center"
                                    >
                                        R1
                                    </TableCell>,
                                );
                                if (campaign.campaignWeeks) {
                                    count += campaign.campaignWeeks;
                                    cells.push(
                                        <TableCell
                                            key={`campaign-duration-${campaign.id}`}
                                            className={classnames(
                                                defaultCellStyles,
                                                classes.campaign,
                                            )}
                                            colSpan={campaign.campaignWeeks}
                                            align="center"
                                        >
                                            {`${campaign.campaignWeeks} WEEKS`}
                                        </TableCell>,
                                    );
                                }
                            }
                            if (lastR2WeekIndex) {
                                count += 1;
                                cells.push(
                                    <TableCell
                                        key={`r2-campaign-${campaign.id}`}
                                        className={classnames(
                                            defaultCellStyles,
                                            classes.round,
                                        )}
                                        colSpan={campaign.r2WeekIndex.length}
                                        align="center"
                                    >
                                        R2
                                    </TableCell>,
                                );
                                if (lastR2WeekIndex < colsCount) {
                                    cells = cells.concat(
                                        Array(colsCount - lastR2WeekIndex)
                                            .fill()
                                            .map((_, i) => (
                                                <TableCell
                                                    className={classnames(
                                                        defaultCellStyles,
                                                        {
                                                            [classes.currentWeek]:
                                                                currentWeekIndex ===
                                                                count + i + 1,
                                                        },
                                                    )}
                                                    align="center"
                                                    key={`cell-${campaign.id}-${
                                                        count + i + 1
                                                    }`}
                                                />
                                            )),
                                    );
                                }
                            }
                            return (
                                <TableRow
                                    className={classes.tableRow}
                                    key={`row-${campaign.id}}`}
                                >
                                    {cells}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            <IconButton onClick={handleGoNext}>
                <ChevronRight color="primary" />
            </IconButton>
        </Box>
    );
};

CampaignsCalendar.defaultProps = {
    campaigns: [],
};

CampaignsCalendar.propTypes = {
    campaigns: PropTypes.array,
    params: PropTypes.object.isRequired,
};

export { CampaignsCalendar };
