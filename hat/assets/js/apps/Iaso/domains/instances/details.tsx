/* eslint-disable react/jsx-props-no-spreading */
import React, { FunctionComponent, useState } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import Alert from '@material-ui/lab/Alert';
import { Box, Grid, makeStyles, Typography } from '@material-ui/core';

import {
    commonStyles,
    IconButton as IconButtonComponent,
    LoadingSpinner,
    useSafeIntl,
} from 'bluesquare-components';
import TopBar from '../../components/nav/TopBarComponent';
import WidgetPaper from '../../components/papers/WidgetPaperComponent';

import InstanceDetailsInfos from './components/InstanceDetailsInfos';
import InstanceDetailsLocation from './components/InstanceDetailsLocation';
import InstanceDetailsExportRequests from './components/InstanceDetailsExportRequests';
import InstanceDetailsLocksHistory from './components/InstanceDetailsLocksHistory';
import InstancesFilesList from './components/InstancesFilesListComponent';
import InstanceFileContent from './components/InstanceFileContent';
import { getInstancesFilesList } from './utils';
import { getRequest } from '../../libs/Api';
import MESSAGES from './messages';
import { baseUrls } from '../../constants/urls';
import { useGetInstance } from './compare/hooks/useGetInstance';
import { UseQueryResult } from 'react-query';
import { useSnackQuery } from '../../libs/apiHooks';
import SpeedDialInstance from './SpeedDialInstance';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    alert: {
        marginBottom: theme.spacing(4),
    },
    labelContainer: {
        display: 'flex',
        width: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
        position: 'relative',
        top: 2,
    },
}));

type Props = {
    params: {
        instanceId: string;
    };
    router: any;
    redirectToReplace: any;
    prevPathname: any;
};

type Logs = {
    list: any[];
};

// TODO Move in hooks or remove
export const useGetInstanceLogs = (
    instanceId: string | undefined,
): UseQueryResult<Logs, Error> => {
    return useSnackQuery<Logs, Error>(
        ['instance', instanceId, 'logs'],
        () =>
            getRequest(
                `/api/logs/?objectId=${instanceId}&order=-created_at&contentType=iaso.instance`,
            ),
        undefined,
        {
            enabled: Boolean(instanceId),
            retry: false,
        },
    );
};

const InstanceDetails: FunctionComponent<Props> = props => {
    const [showDial, setShowDial] = useState(true);
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const {
        router,
        prevPathname,
        redirectToReplace,
        params: { instanceId },
        params,
    } = props;
    const { data: currentInstance, isLoading: fetching } =
        useGetInstance(instanceId);

    // not showing history link in submission detail if there is only one version/log
    // in the futur. add this info directly in the instance api to not make another call;
    const { data: instanceLogsDetails } = useGetInstanceLogs(instanceId);
    const showHistoryLink = instanceLogsDetails?.list?.length ?? 0 > 1;

    const onLightBoxToggled = open => {
        setShowDial(!open);
    };

    return (
        <section className={classes.relativeContainer}>
            <TopBar
                title={
                    currentInstance
                        ? `${
                              currentInstance.form_name
                          }: ${currentInstance.file_name.replace('.xml', '')}`
                        : ''
                }
                displayBackButton
                goBack={() => {
                    if (prevPathname || !currentInstance) {
                        router.goBack();
                    } else {
                        redirectToReplace(baseUrls.instances, {
                            formIds: currentInstance.form_id,
                        });
                    }
                }}
            />
            {fetching && <LoadingSpinner />}
            {currentInstance && (
                <Box className={classes.containerFullHeightNoTabPadded}>
                    {currentInstance.can_user_modify && showDial && (
                        <SpeedDialInstance
                            currentInstance={currentInstance}
                            params={params}
                        />
                    )}
                    <Grid container spacing={4}>
                        <Grid xs={12} md={4} item>
                            {currentInstance.deleted && (
                                <Alert
                                    severity="warning"
                                    className={classes.alert}
                                >
                                    {formatMessage(MESSAGES.warningSoftDeleted)}
                                    <br />
                                    {formatMessage(
                                        MESSAGES.warningSoftDeletedExport,
                                    )}
                                    <br />
                                    {formatMessage(
                                        MESSAGES.warningSoftDeletedDerived,
                                    )}
                                    <br />
                                </Alert>
                            )}
                            <WidgetPaper
                                title={formatMessage(MESSAGES.infos)}
                                padded
                                id="infos"
                            >
                                <InstanceDetailsInfos
                                    currentInstance={currentInstance}
                                />

                                {currentInstance && showHistoryLink && (
                                    <Grid container spacing={1}>
                                        <Grid xs={5} item>
                                            <div
                                                className={
                                                    classes.labelContainer
                                                }
                                            >
                                                <Typography
                                                    variant="body2"
                                                    noWrap
                                                    color="inherit"
                                                    title="Historique"
                                                >
                                                    {formatMessage(
                                                        MESSAGES.history,
                                                    )}
                                                </Typography>
                                                :
                                            </div>
                                        </Grid>

                                        <Grid
                                            xs={7}
                                            container
                                            item
                                            justifyContent="flex-start"
                                            alignItems="center"
                                        >
                                            <Typography
                                                variant="body1"
                                                color="inherit"
                                            >
                                                <Link
                                                    to={`${baseUrls.compareInstanceLogs}/instanceIds/${currentInstance.id}`}
                                                >
                                                    {formatMessage(
                                                        MESSAGES.seeAllVersions,
                                                    )}
                                                </Link>
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                )}
                            </WidgetPaper>
                            <WidgetPaper
                                title={formatMessage(MESSAGES.location)}
                                id="location"
                            >
                                <InstanceDetailsLocation
                                    currentInstance={currentInstance}
                                />
                            </WidgetPaper>
                            <InstanceDetailsExportRequests
                                currentInstance={currentInstance}
                                classes={classes}
                            />

                            <InstanceDetailsLocksHistory
                                currentInstance={currentInstance}
                                classes={classes}
                            />

                            {currentInstance.files.length > 0 && (
                                <WidgetPaper
                                    title={formatMessage(MESSAGES.files)}
                                    padded
                                    id="files"
                                >
                                    <InstancesFilesList
                                        fetchDetails={false}
                                        instanceDetail={currentInstance}
                                        files={getInstancesFilesList([
                                            currentInstance,
                                        ])}
                                        onLightBoxToggled={open =>
                                            onLightBoxToggled(open)
                                        }
                                    />
                                </WidgetPaper>
                            )}
                        </Grid>

                        <Grid xs={12} md={8} item>
                            <WidgetPaper
                                id="form-contents"
                                title={formatMessage(MESSAGES.submission)}
                                IconButton={IconButtonComponent}
                                iconButtonProps={{
                                    onClick: () =>
                                        window.open(
                                            currentInstance.file_url,
                                            '_blank',
                                        ),
                                    icon: 'xml',
                                    color: 'secondary',
                                    tooltipMessage: MESSAGES.downloadXml,
                                }}
                            >
                                <InstanceFileContent
                                    instance={currentInstance}
                                />
                            </WidgetPaper>
                        </Grid>
                    </Grid>
                </Box>
            )}
        </section>
    );
};

InstanceDetails.defaultProps = {
    prevPathname: null,
};

const MapStateToProps = state => ({
    prevPathname: state.routerCustom.prevPathname,
});

const MapDispatchToProps = _dispatch => ({});

export default connect(MapStateToProps, MapDispatchToProps)(InstanceDetails);
