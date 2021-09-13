import React from 'react';
import red from '@material-ui/core/colors/red';

import classnames from 'classnames';
import PropTypes from 'prop-types';

import {
    Table,
    TableContainer,
    TableHead,
    TableRow,
    TableCell,
    Box,
    makeStyles,
    TableBody,
} from '@material-ui/core';

const getMonth = columns => {
    let cols = [];
    columns.forEach(c => {
        if (c.columns) {
            cols = cols.concat(c.columns);
        }
    });
    return cols;
};
const getWeeks = columns => {
    let cols = [];
    columns.forEach(c => {
        if (c.columns) {
            c.columns.forEach(subC => {
                if (subC.columns) {
                    cols = cols.concat(subC.columns);
                }
            });
        }
    });
    return cols;
};
const useStyles = makeStyles(theme => ({
    tableContainer: {
        overflow: 'hidden',
        width: 800,
        borderTop: `1px solid ${theme.palette.ligthGray.border}`,
        borderRight: `1px solid ${theme.palette.ligthGray.border}`,
    },
    tableRow: {
        height: 50,
        borderLeft: `1px solid ${theme.palette.ligthGray.border}`,
    },
    tableCell: {
        height: 50,
        padding: 0,
        margin: 0,
        border: 'none',
    },
    tableCellBordered: {
        border: `1px solid ${theme.palette.ligthGray.border}`,
    },
    tableCellFixed: {
        width: 50,
    },
    round: {
        backgroundColor: theme.palette.secondary.main,
        color: theme.palette.common.white,
    },
    campaign: {
        backgroundColor: theme.palette.grey[200],
        border: 'none',
    },
    currentWeek: {
        backgroundColor: red['100'],
    },
}));

const CampaignsCalendar = ({
    campaigns,
    columns,
    currentWeekIndex,
    colsCount,
}) => {
    const classes = useStyles();
    const defaultCellStyles = [
        classes.tableCell,
        classes.tableCellBordered,
        classes.tableCellFixed,
    ];
    return (
        <Box mb={2} mt={2}>
            <TableContainer className={classes.tableContainer}>
                <Table>
                    <TableHead>
                        <TableRow className={classes.tableRow}>
                            <TableCell
                                className={classes.tableCell}
                                align="center"
                                colSpan={colsCount}
                            >
                                {columns[0].value}
                            </TableCell>
                        </TableRow>
                        <TableRow className={classes.tableRow}>
                            {getMonth(columns).map(month => (
                                <TableCell
                                    className={classes.tableCell}
                                    key={month.value}
                                    align="center"
                                    colSpan="4"
                                >
                                    {month.value}
                                </TableCell>
                            ))}
                        </TableRow>
                        <TableRow className={classes.tableRow}>
                            {getWeeks(columns).map(week => (
                                <TableCell
                                    className={classnames([
                                        classes.tableCell,
                                        classes.tableCellFixed,
                                    ])}
                                    key={week.value}
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
        </Box>
    );
};

CampaignsCalendar.defaultProps = {
    columns: [],
    campaigns: [],
    currentWeekIndex: 0,
    colsCount: 16,
};

CampaignsCalendar.propTypes = {
    campaigns: PropTypes.array,
    columns: PropTypes.array,
    currentWeekIndex: PropTypes.number,
    colsCount: PropTypes.number,
};

export { CampaignsCalendar };
