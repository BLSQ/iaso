import React, { FunctionComponent, useMemo } from 'react';
import { Box, Grid, Theme, GridSize } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useSafeIntl, commonStyles } from 'bluesquare-components';
import TopBar from '../../../components/nav/TopBarComponent';
import InstanceDetail from './components/InstanceDetail';
import MESSAGES from './messages';
import { baseUrls } from '../../../constants/urls';
import { useParamsObject } from '../../../routing/hooks/useParamsObject';
import { useGoBack } from '../../../routing/hooks/useGoBack';

type Params = {
    instanceIds: string;
};

const useStyles = makeStyles((theme: Theme) => ({
    ...commonStyles(theme),
}));

const CompareSubmissions: FunctionComponent = () => {
    const params = useParamsObject(baseUrls.compareInstances) as Params;
    const { formatMessage } = useSafeIntl();
    const goBack = useGoBack(baseUrls.instances);
    const classes: Record<string, string> = useStyles();

    const instanceIds: Array<string> = params.instanceIds.split(',');
    const colSize: number = useMemo(() => {
        if (instanceIds.length < 12 && instanceIds.length > 0) {
            return 12 / instanceIds.length;
        }
        return 12;
    }, [instanceIds]);
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton
                goBack={goBack}
            />
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

export default CompareSubmissions;
