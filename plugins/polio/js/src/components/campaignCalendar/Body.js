import React from 'react';
import PropTypes from 'prop-types';

import { TableRow, TableBody, TableCell } from '@material-ui/core';
import { FormattedMessage } from 'react-intl';

import { useStyles } from './Styles';

import { getCells } from './utils';
import { colsCount, colSpanTitle, staticFields } from './constants';
import { StaticFieldsCells } from './cells/StaticFields';
import MESSAGES from '../../constants/messages';

const Body = ({
    campaigns,
    currentWeekIndex,
    firstMonday,
    lastSunday,
    loadingCampaigns,
}) => {
    const classes = useStyles();
    return (
        <TableBody>
            {campaigns.length === 0 && (
                <TableRow className={classes.tableRow}>
                    <TableCell
                        className={classes.noCampaign}
                        colSpan={
                            colsCount * 7 + staticFields.length * colSpanTitle
                        }
                    >
                        {!loadingCampaigns && (
                            <FormattedMessage {...MESSAGES.noCampaign} />
                        )}
                    </TableCell>
                </TableRow>
            )}
            {campaigns.map(campaign => {
                return (
                    <TableRow
                        className={classes.tableRow}
                        key={`row-${campaign.id}}`}
                    >
                        <StaticFieldsCells campaign={campaign} />
                        {getCells(
                            campaign,
                            currentWeekIndex,
                            firstMonday,
                            lastSunday,
                        )}
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
    loadingCampaigns: PropTypes.bool.isRequired,
};

export { Body };
