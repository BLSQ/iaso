import React, { FunctionComponent, useMemo } from 'react';

import { Box, Grid, Theme, GridSize } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { useSafeIntl, commonStyles } from 'bluesquare-components';

import TopBar from '../../../components/nav/TopBarComponent';

import InstanceDetail from './components/InstanceDetail';

import MESSAGES from './messages';

interface IProps {
    params: any;
}

const useStyles = makeStyles((theme: Theme) => ({
    ...commonStyles(theme),
}));

const DuplicatesSubmissions: FunctionComponent<IProps> = ({ params }) => {
    const { formatMessage } = useSafeIntl();
    const classes: any = useStyles();

    const instanceIds = params.instanceIds.split(',');
    const colSize: number = useMemo(() => {
        if (instanceIds.length < 12 && instanceIds.length > 0) {
            return 12 / instanceIds.length;
        }
        return 12;
    }, [instanceIds]);

    return (
        <>
            <TopBar title={formatMessage(MESSAGES.title)} />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Grid container spacing={4}>
                    {instanceIds.map((instanceId: string) => (
                        <Grid
                            key={instanceId}
                            xs={12}
                            md={colSize as GridSize}
                            item
                        >
                            <InstanceDetail instanceId={instanceId} />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </>
    );
};

export default DuplicatesSubmissions;
