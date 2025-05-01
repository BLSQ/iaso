import React, { FunctionComponent, useState } from 'react';
import Alert from '@mui/lab/Alert';
import { Box, Grid, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';

import {
    IconButton,
    LinkWithLocation,
    LoadingSpinner,
    commonStyles,
    useGoBack,
    useSafeIntl,
} from 'bluesquare-components';
import { UseQueryResult } from 'react-query';
import TopBar from '../../components/nav/TopBarComponent';
import WidgetPaper from '../../components/papers/WidgetPaperComponent';

import { baseUrls } from '../../constants/urls';
import { getRequest } from '../../libs/Api';
import { useSnackQuery } from '../../libs/apiHooks';
import {
    ParamsWithAccountId,
    useParamsObject,
} from '../../routing/hooks/useParamsObject';
import { ClassNames } from '../../types/utils';
import { EntityBaseInfo } from '../entities/components/EntityBaseInfo';
import { useGetEntityFields } from '../entities/hooks/useGetEntityFields';
import { useGetInstance } from './compare/hooks/useGetInstance';
import InstanceDetailsChangeRequests from './components/InstanceDetailsChangeRequests';
import InstanceDetailsExportRequests from './components/InstanceDetailsExportRequests';
import InstanceDetailsInfos from './components/InstanceDetailsInfos';
import InstanceDetailsLocation from './components/InstanceDetailsLocation';
import InstanceDetailsLocksHistory from './components/InstanceDetailsLocksHistory';
import InstanceFileContent from './components/InstanceFileContent';
import InstancesFilesList from './components/InstancesFilesListComponent';
import SpeedDialInstance from './components/SpeedDialInstance';
import { INSTANCE_METAS_FIELDS } from './constants';
import {
    ReassignInstancePayload,
    useReassignInstance,
} from './hooks/useReassignInstance';
import MESSAGES from './messages';
import { getInstancesFilesList } from './utils';

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

const InstanceDetails: FunctionComponent = () => {
    const [showDial, setShowDial] = useState(true);

    const { mutateAsync: reassignInstance, isLoading: isReassigning } =
        useReassignInstance<ReassignInstancePayload>();

    const { formatMessage } = useSafeIntl();
    const classes: ClassNames = useStyles();
    const goBack = useGoBack(baseUrls.instances);

    const params = useParamsObject(
        baseUrls.instanceDetail,
    ) as ParamsWithAccountId & {
        instanceId: string;
    };
    const { instanceId } = params;
    const { data: currentInstance, isLoading: isLoadingInstance } =
        useGetInstance(instanceId);
    const { isLoading: isLoadingEntityFields, fields: entityFields } =
        useGetEntityFields(currentInstance?.entity);

    const isLoading =
        isReassigning ||
        isLoadingInstance ||
        (currentInstance?.entity && isLoadingEntityFields);

    // not showing history link in submission detail if there is only one version/log
    // in the future. add this info directly in the instance api to not make another call;
    const { data: instanceLogsDetails } = useGetInstanceLogs(instanceId);
    const showHistoryLink = (instanceLogsDetails?.list?.length || 0) > 1;

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
                goBack={() => goBack()}
            />
            {isLoading && <LoadingSpinner />}
            {currentInstance && !isLoading && (
                <Box className={classes.containerFullHeightNoTabPadded}>
                    {currentInstance.can_user_modify && showDial && (
                        <SpeedDialInstance
                            currentInstance={currentInstance}
                            params={params}
                            reassignInstance={reassignInstance}
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
                            {currentInstance && currentInstance.entity && (
                                <EntityBaseInfo
                                    entity={currentInstance.entity}
                                    fields={entityFields}
                                    withLinkToEntity
                                />
                            )}
                            <WidgetPaper
                                title={formatMessage(MESSAGES.infos)}
                                padded
                                id="infos"
                            >
                                <InstanceDetailsInfos
                                    instance_metas_fields={
                                        INSTANCE_METAS_FIELDS
                                    }
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
                                                <LinkWithLocation
                                                    to={`/${baseUrls.compareInstanceLogs}/instanceIds/${currentInstance.id}`}
                                                >
                                                    {formatMessage(
                                                        MESSAGES.seeAllVersions,
                                                    )}
                                                </LinkWithLocation>
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
                            {currentInstance.change_requests.length > 0 && (
                                <WidgetPaper
                                    title={formatMessage(
                                        MESSAGES.changeRequests,
                                    )}
                                    id="change-request"
                                >
                                    <InstanceDetailsChangeRequests
                                        currentInstance={currentInstance}
                                        disabled={currentInstance.deleted}
                                    />
                                </WidgetPaper>
                            )}
                            <InstanceDetailsExportRequests
                                currentInstance={currentInstance}
                                classes={classes}
                            />

                            <InstanceDetailsLocksHistory
                                currentInstance={currentInstance}
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
                                            setShowDial(!open)
                                        }
                                    />
                                </WidgetPaper>
                            )}
                        </Grid>

                        <Grid xs={12} md={8} item>
                            <WidgetPaper
                                id="form-contents"
                                title={formatMessage(MESSAGES.submission)}
                                IconButton={IconButton}
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

export default InstanceDetails;
