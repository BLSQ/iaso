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
import { GeneralInfoWidgetPaper as GeneralInfoWidgetPaperMissionEntityType } from 'Iaso/domains/missions/components/details/missionEntityType/GeneralInfoWidgetPaper';
import { GeneralInfoWidgetPaper as GeneralInfoWidgetPaperMissionForm } from 'Iaso/domains/missions/components/details/missionForm/GeneralInfoWidgetPaper';
import { GeneralInfoWidgetPaper as GeneralInfoWidgetPaperMissionOrgUnitType } from 'Iaso/domains/missions/components/details/missionOrgUnitType/GeneralInfoWidgetPaper';
import { TopActions } from 'Iaso/domains/missions/components/details/TopActions';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { FormWidgetPaper } from './components/details/FormWidgetPaper';
import { DetailsWrapper } from './components/DetailsWrapper';
import MESSAGES from './messages';
import {
    isMissionEntityTypeRetrieve,
    isMissionFormRetrieve,
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
                <Stack spacing={2} sx={{ p: 2 }}>
                    {isMissionFormRetrieve(data) && (
                        <GeneralInfoWidgetPaperMissionForm mission={data} />
                    )}
                    {isMissionEntityTypeRetrieve(data) && (
                        <GeneralInfoWidgetPaperMissionEntityType
                            mission={data}
                        />
                    )}
                    {isMissionOrgUnitTypeRetrieve(data) && (
                        <GeneralInfoWidgetPaperMissionOrgUnitType
                            mission={data}
                        />
                    )}
                    <FormWidgetPaper mission={data} />
                </Stack>
            </DetailsWrapper>
        </>
    );
};
