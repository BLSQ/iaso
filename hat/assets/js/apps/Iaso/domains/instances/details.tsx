import React, { FunctionComponent, useState } from 'react';
import Alert from '@mui/lab/Alert';
import { Box, Grid } from '@mui/material';

import { LoadingSpinner, useGoBack, useSafeIntl } from 'bluesquare-components';
import { UseQueryResult } from 'react-query';
import { MainWrapper } from '../../components/MainWrapper';
import TopBar from '../../components/nav/TopBarComponent';

import { baseUrls } from '../../constants/urls';
import { getRequest } from '../../libs/Api';
import { useSnackQuery } from '../../libs/apiHooks';
import {
    ParamsWithAccountId,
    useParamsObject,
} from '../../routing/hooks/useParamsObject';
import { useGetEntityFields } from '../entities/hooks/useGetEntityFields';
import { Descriptor } from './components/InstanceFileContentRich';
import SpeedDialInstance from './components/SpeedDialInstance';
import { SubmissionContent } from './components/SubmissionContent/SubmissionContent';
import { EntityCard } from './components/SubmissionRail/EntityCard';
import { SubmissionRail } from './components/SubmissionRail/SubmissionRail';
import { useGetInstance } from './hooks/requests/useGetInstance';
import {
    ReassignInstancePayload,
    useReassignInstance,
} from './hooks/useReassignInstance';
import MESSAGES from './messages';

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
        <Box component="section" sx={{ position: 'relative' }}>
            <TopBar
                title={
                    currentInstance
                        ? `${formatMessage(MESSAGES.submission)}: ${
                              currentInstance.form_name
                          }${
                              currentInstance.org_unit?.name
                                  ? ` · 📍 ${currentInstance.org_unit.name}`
                                  : ''
                          }`
                        : ''
                }
                displayBackButton
                goBack={goBack}
            />
            {isLoading && <LoadingSpinner />}
            {currentInstance && !isLoading && (
                <MainWrapper sx={{ p: 4 }}>
                    {currentInstance.can_user_modify && showDial && (
                        <SpeedDialInstance
                            currentInstance={currentInstance}
                            params={params}
                            reassignInstance={reassignInstance}
                        />
                    )}
                    <Grid container spacing={3}>
                        <Grid xs={12} md={8} lg={9} item>
                            <SubmissionContent
                                formDescriptor={
                                    currentInstance.form_descriptor as Descriptor
                                }
                                instanceData={currentInstance.file_content}
                                files={currentInstance.files ?? []}
                            />
                        </Grid>

                        <Grid xs={12} md={4} lg={3} item>
                            {currentInstance.deleted && (
                                <Alert severity="warning" sx={{ mb: 4 }}>
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
                                <EntityCard
                                    entity={currentInstance.entity}
                                    fields={entityFields}
                                    withLinkToEntity
                                />
                            )}
                            <SubmissionRail
                                currentInstance={currentInstance}
                                showHistoryLink={showHistoryLink}
                                onLightBoxToggled={open => setShowDial(!open)}
                            />
                        </Grid>
                    </Grid>
                </MainWrapper>
            )}
        </Box>
    );
};

export default InstanceDetails;
