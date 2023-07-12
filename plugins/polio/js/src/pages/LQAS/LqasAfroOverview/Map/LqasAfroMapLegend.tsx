import React, { FunctionComponent, useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { makeStyles } from '@material-ui/core';
import MESSAGES from '../../../../constants/messages';
import { FAIL_COLOR, OK_COLOR } from '../../../../styles/constants';
import { MapLegend } from '../../../../components/MapComponent/MapLegend';

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

const useLegendItems = () => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        const passed = formatMessage(MESSAGES.passing);
        const failed = formatMessage(MESSAGES.failing);
        return [
            {
                label: passed,
                value: passed,
                color: OK_COLOR,
            },
            {
                label: failed,
                value: failed,
                color: FAIL_COLOR,
            },
        ];
    }, [formatMessage]);
};

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
