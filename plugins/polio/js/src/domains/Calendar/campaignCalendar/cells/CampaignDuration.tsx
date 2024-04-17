import { useSafeIntl } from 'bluesquare-components';
import classnames from 'classnames';
import React, { FunctionComponent } from 'react';

import { TableCell } from '@mui/material';
import { useStyles } from '../Styles';

import MESSAGES from '../../../../constants/messages';
import { PeriodType } from '../types';

interface Props {
    colSpan: number;
    weeksCount: number;
    periodType: PeriodType;
}

const CampaignDurationCell: FunctionComponent<Props> = ({
    colSpan,
    weeksCount,
    periodType,
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const defaultCellStyles = [classes.tableCell, classes.tableCellBordered];
    if (colSpan <= 0) return null;
    return (
        <TableCell
            className={classnames(defaultCellStyles, classes.campaign)}
            colSpan={colSpan}
        >
            {colSpan > 5 && (
                <span
                    className={classnames(
                        classes.tableCellSpan,
                        classes.weeksCell,
                    )}
                >
                    {periodType === 'year' &&
                        `${weeksCount} ${formatMessage(MESSAGES.weeksShort)}`}
                    {periodType !== 'year' &&
                        `${weeksCount} ${formatMessage(MESSAGES.weeks)}`}
                </span>
            )}
        </TableCell>
    );
};

export { CampaignDurationCell };
