import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useSafeIntl } from 'bluesquare-components';

import { TableCell } from '@material-ui/core';
import { useStyles } from '../Styles';

import MESSAGES from '../../../constants/messages';

const CampaignDurationCell = ({ colSpan, hasNextRound, round }) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const defaultCellStyles = [classes.tableCell, classes.tableCellBordered];
    if (colSpan <= 0) return null;
    return (
        <TableCell
            className={classnames(defaultCellStyles, classes.campaign, {
                [classes.tableCellDashed]: !hasNextRound,
            })}
            colSpan={colSpan}
        >
            {colSpan > 5 && (
                <span
                    className={classnames(
                        classes.tableCellSpan,
                        classes.weeksCell,
                    )}
                >
                    {`${round.weeksCount} ${formatMessage(MESSAGES.weeks)}`}
                </span>
            )}
        </TableCell>
    );
};

CampaignDurationCell.propTypes = {
    colSpan: PropTypes.number.isRequired,
    hasNextRound: PropTypes.bool.isRequired,
    round: PropTypes.object.isRequired,
};

export { CampaignDurationCell };
