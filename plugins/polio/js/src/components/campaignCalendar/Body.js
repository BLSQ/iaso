import React from 'react';
import PropTypes from 'prop-types';

import { TableRow, TableBody } from '@material-ui/core';
import { useStyles } from './Styles';

import { getCells } from './utils';
import { StaticFieldsCells } from './cells/StaticFields';
import { PlaceholderRow } from './PlaceholderRow';
import { RoundPopperContextProvider } from './contexts/RoundPopperContext.tsx';

const Body = ({
    campaigns,
    currentWeekIndex,
    firstMonday,
    lastSunday,
    loadingCampaigns,
}) => {
    const classes = useStyles();
    return (
        <RoundPopperContextProvider>
            <TableBody>
                {campaigns.length === 0 && (
                    <PlaceholderRow loadingCampaigns={loadingCampaigns} />
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
        </RoundPopperContextProvider>
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
