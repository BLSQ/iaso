import React, { FunctionComponent } from 'react';

import { Box, Grid, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { useSafeIntl, commonStyles } from 'bluesquare-components';

import WidgetPaper from '../../../components/papers/WidgetPaperComponent';
import TopBar from '../../../components/nav/TopBarComponent';

import { useGetInstance } from './hooks/useGetInstance';
import InstanceDetailsInfos from '../components/InstanceDetailsInfos';
import InstanceDetailsLocation from '../components/InstanceDetailsLocation';

import MESSAGES from './messages';

interface IProps {
    params: any;
}

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const DuplicatesSubmissions: FunctionComponent<IProps> = ({ params }) => {
    const { data: instance } = useGetInstance(params.instanceId);
    const { data: duplicateInstance } = useGetInstance(
        params.duplicateInstanceId,
    );
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();

    return (
        <>
            <TopBar title={formatMessage(MESSAGES.title)} />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Grid container spacing={4}>
                    <Grid xs={12} md={6} item>
                        <Box mb={4}>
                            <Typography variant="h5" color="secondary">
                                {`${formatMessage(
                                    MESSAGES.submissionTitle,
                                )} - A`}
                            </Typography>
                        </Box>
                        {instance && (
                            <>
                                <WidgetPaper
                                    expandable
                                    isExpanded={false}
                                    title={formatMessage(MESSAGES.infos)}
                                    padded
                                >
                                    <InstanceDetailsInfos
                                        currentInstance={instance}
                                    />
                                </WidgetPaper>
                                <WidgetPaper
                                    expandable
                                    isExpanded={false}
                                    title={formatMessage(MESSAGES.location)}
                                >
                                    <InstanceDetailsLocation
                                        currentInstance={instance}
                                    />
                                </WidgetPaper>
                            </>
                        )}
                    </Grid>
                    <Grid xs={12} md={6} item>
                        <Box mb={4}>
                            <Typography variant="h5" color="secondary">
                                {`${formatMessage(
                                    MESSAGES.submissionTitle,
                                )} - B`}
                            </Typography>
                        </Box>
                        {duplicateInstance && (
                            <>
                                <WidgetPaper
                                    title={formatMessage(MESSAGES.infos)}
                                    padded
                                    expandable
                                    isExpanded={false}
                                >
                                    <InstanceDetailsInfos
                                        currentInstance={duplicateInstance}
                                    />
                                </WidgetPaper>
                                <WidgetPaper
                                    title={formatMessage(MESSAGES.location)}
                                    expandable
                                    isExpanded={false}
                                >
                                    <InstanceDetailsLocation
                                        currentInstance={duplicateInstance}
                                    />
                                </WidgetPaper>
                            </>
                        )}
                    </Grid>
                </Grid>
            </Box>
        </>
    );
};

export default DuplicatesSubmissions;
