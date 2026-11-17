import React from 'react';
import { Stack } from '@mui/material';
import {
    LoadingSpinner,
    useRedirectTo,
    useSafeIntl,
} from 'bluesquare-components';
import { useApiMicroplanningMissionsRetrieve } from 'Iaso/api/missions';
import Page404 from 'Iaso/components/errors/Page404';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { TopActions } from 'Iaso/domains/missions/components/details/TopActions';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { CreatedTypeSection } from './components/details/CreatedTypeSection';
import { FormWidgetPaper } from './components/details/FormWidgetPaper';
import { GeneralInfoSection } from './components/details/GeneralInfoSection';
import { DetailsWrapper } from './components/DetailsWrapper';
import MESSAGES from './messages';
import {
    isMissionEntityTypeRetrieve,
    isMissionOrgUnitTypeRetrieve,
} from './utils';

const baseRedirectUrl = `${baseUrls.missions}`;

export const MissionDetail = () => {
    const params = useParamsObject(baseUrls.missionsDetails);
    const missionId = parseInt(params.id);

    const { data, isLoading } = useApiMicroplanningMissionsRetrieve(missionId);
    const { formatMessage } = useSafeIntl();
    const redirectTo = useRedirectTo();

    if (isLoading) {
        return (
            <>
                <TopBar
                    title={formatMessage(MESSAGES.title)}
                    displayBackButton
                    goBack={() => redirectTo(baseRedirectUrl)}
                />
                <LoadingSpinner />
            </>
        );
    }

    if (!data) {
        return <Page404 displayTopBar={true} />;
    }

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.missionDetailTitle, {
                    name: data.name,
                })}
                goBack={() => redirectTo(baseRedirectUrl)}
                displayBackButton
            />
            <DetailsWrapper
                title={data.name}
                actions={
                    <TopActions missionId={missionId} missionName={data.name} />
                }
            >
                <Stack spacing={3} sx={{ p: 3 }}>
                    <GeneralInfoSection mission={data} />
                    {(isMissionOrgUnitTypeRetrieve(data) ||
                        isMissionEntityTypeRetrieve(data)) && (
                        <CreatedTypeSection mission={data} />
                    )}
                    <FormWidgetPaper mission={data} />
                </Stack>
            </DetailsWrapper>
        </>
    );
};
