import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useSafeIntl } from 'bluesquare-components';

import { TableCell } from '@mui/material';
import { useStyles } from '../Styles';

import MESSAGES from '../../../../constants/messages';

const CampaignDurationCell = ({ colSpan, weeksCount }) => {
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
                    {`${weeksCount} ${formatMessage(MESSAGES.weeks)}`}
                </span>
            )}
        </TableCell>
    );
};

CampaignDurationCell.propTypes = {
    colSpan: PropTypes.number.isRequired,
    weeksCount: PropTypes.number.isRequired,
};

export { CampaignDurationCell };
