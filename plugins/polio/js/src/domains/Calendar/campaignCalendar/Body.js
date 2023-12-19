import React from 'react';
import PropTypes from 'prop-types';

import { TableRow, TableBody } from '@mui/material';
import { useStyles } from './Styles';

import { getCells } from './utils';
import { StaticFieldsCells } from './cells/StaticFields';
import { PlaceholderRow } from './PlaceholderRow';
import { RoundPopperContextProvider } from './contexts/RoundPopperContext';

const Body = ({
    campaigns,
    currentWeekIndex,
    firstMonday,
    lastSunday,
    loadingCampaigns,
    isPdf,
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
                            <StaticFieldsCells
                                campaign={campaign}
                                isPdf={isPdf}
                            />
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
    isPdf: PropTypes.bool.isRequired,
};

export { Body };
