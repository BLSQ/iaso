import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';

import { TableRow, TableCell, TableBody } from '@material-ui/core';

import { useStyles } from './Styles';

import { colsCount } from './constants';

const Body = ({ campaigns, currentWeekIndex }) => {
    const classes = useStyles();
    const defaultCellStyles = [
        classes.tableCell,
        classes.tableCellBordered,
        classes.tableCellFixed,
    ];
    console.log('campaigns', campaigns);
    return (
        <TableBody>
            {campaigns.map(campaign => {
                let cells = [];
                const firstR1WeekIndex = campaign.r1WeekIndex[0];
                const lastR2WeekIndex =
                    campaign.r2WeekIndex &&
                    campaign.r2WeekIndex[campaign.r2WeekIndex.length - 1];
                let count = 0;
                if (firstR1WeekIndex && firstR1WeekIndex > 1) {
                    cells = Array(firstR1WeekIndex - 1)
                        .fill()
                        .map((_, i) => (
                            <TableCell
                                className={classnames(defaultCellStyles, {
                                    [classes.currentWeek]:
                                        i === currentWeekIndex - 1,
                                })}
                                align="center"
                                key={`cell-${campaign.id}-${count + i + 1}`}
                            />
                        ));
                    count = firstR1WeekIndex - 1;
                }
                if (firstR1WeekIndex) {
                    count += campaign.r1WeekIndex.length;
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
                }
                if (
                    campaign.r2WeekIndex.length > 0 ||
                    campaign.r1WeekIndex.length > 0
                ) {
                    let campaignLength = 6;
                    if (
                        campaign.r2WeekIndex.length > 0 &&
                        campaign.r1WeekIndex.length > 0
                    ) {
                        const lastR1WeekIndex =
                            campaign.r1WeekIndex[
                                campaign.r1WeekIndex.length - 1
                            ];
                        const firstR2WeekIndex = campaign.r2WeekIndex[0];
                        campaignLength = firstR2WeekIndex - lastR1WeekIndex;
                        // console.log('firstR2WeekIndex', firstR2WeekIndex);
                        // console.log('lastR1WeekIndex', lastR1WeekIndex);
                    }
                    console.log('', campaign.campaignWeeks);
                    count += campaignLength;
                    cells.push(
                        <TableCell
                            key={`campaign-duration-${campaign.id}`}
                            className={classnames(
                                defaultCellStyles,
                                classes.campaign,
                            )}
                            colSpan={campaignLength}
                            align="center"
                        >
                            {/* {`${campaign.campaignWeeks} WEEK(S)`} */}
                            {campaign.name}
                        </TableCell>,
                    );
                }
                if (lastR2WeekIndex) {
                    count += campaign.r2WeekIndex.length;
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
                }
                if (colsCount - count > 0) {
                    cells = cells.concat(
                        Array(colsCount - count)
                            .fill()
                            .map((_, i) => (
                                <TableCell
                                    className={classnames(defaultCellStyles, {
                                        [classes.currentWeek]:
                                            currentWeekIndex === count + i + 1,
                                    })}
                                    align="center"
                                    key={`cell-${campaign.id}-${count + i + 1}`}
                                />
                            )),
                    );
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
    );
};

Body.propTypes = {
    campaigns: PropTypes.array.isRequired,
    currentWeekIndex: PropTypes.number.isRequired,
};

export { Body };
