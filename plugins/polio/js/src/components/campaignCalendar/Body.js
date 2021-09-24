import React from 'react';
import PropTypes from 'prop-types';

import { TableRow, TableBody } from '@material-ui/core';

import { useStyles } from './Styles';

import { getCells } from './utils';
import { StaticFieldsCells } from './cells/StaticFields';

const Body = ({ campaigns, currentWeekIndex, firstMonday, lastSunday }) => {
    const classes = useStyles();
    return (
        <TableBody>
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
};

export { Body };
