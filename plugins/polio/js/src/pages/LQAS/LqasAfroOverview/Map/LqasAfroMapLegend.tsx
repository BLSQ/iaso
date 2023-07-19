import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { makeStyles } from '@material-ui/core';
import MESSAGES from '../../../../constants/messages';
import { MapLegend } from '../../../../components/MapComponent/MapLegend';
import { useLegendItems } from '../utils';

const useStyles = makeStyles(theme => {
    return {
        mapLegendContainer: {
            position: 'absolute',
            zIndex: 499,
            fontSize: 10,
            top: theme.spacing(5),
            right: theme.spacing(1),
        },
    };
});

export const LqasAfroMapLegend: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    const legendItems = useLegendItems();
    const classes: Record<string, string> = useStyles();
    return (
        <div className={classes.mapLegendContainer}>
            <MapLegend
                title={formatMessage(MESSAGES.legend)}
                legendItems={legendItems}
                width="md"
            />
        </div>
    );
};
