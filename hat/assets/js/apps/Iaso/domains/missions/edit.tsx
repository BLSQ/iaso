import React, { FunctionComponent } from 'react';
import {
    useSafeIntl,
    useRedirectTo,
    LoadingSpinner,
} from 'bluesquare-components';
import {
    useApiMicroplanningMissionsRetrieve,
    useApiMicroplanningMissionsUpdate,
} from 'Iaso/api/missions';
import Page404 from 'Iaso/components/errors/Page404';
import { MainWrapper } from 'Iaso/components/MainWrapper';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { EditBaseMissionEntityType } from 'Iaso/domains/missions/components/edit/EditBaseMissionEntityType';
import { EditBaseMissionForm } from 'Iaso/domains/missions/components/edit/EditBaseMissionForm';
import { EditBaseMissionOrgUnitType } from 'Iaso/domains/missions/components/edit/EditBaseMissionOrgUnitType';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import MESSAGES from './messages';
import {
    isMissionEntityTypeRetrieve,
    isMissionFormRetrieve,
    isMissionOrgUnitTypeRetrieve,
} from './utils';

export const MissionEdit: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();

    const params = useParamsObject(baseUrls.missionsEdit);
    const missionId = parseInt(params.id);

    const { data, isLoading } = useApiMicroplanningMissionsRetrieve(missionId);

    const redirectTo = useRedirectTo();
    const redirectBackUrl: string = `/${baseUrls.missionsDetails}/id/${missionId}/`;

    const { mutateAsync: save } = useApiMicroplanningMissionsUpdate({
        mutation: {
            onSuccess: (_variables, _data) => {
                redirectTo(redirectBackUrl);
            },
            meta: {
                ignoreErrorCodes: [400],
            },
        },
    });

    if (isLoading) {
        return (
            <>
                <TopBar
                    title={formatMessage(MESSAGES.editMissionNoName)}
                    displayBackButton
                    goBack={() => redirectTo(redirectBackUrl)}
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
                title={formatMessage(MESSAGES.editMission, { name: data.name })}
                goBack={() => redirectTo(redirectBackUrl)}
                displayBackButton
            />
            <MainWrapper sx={{ p: 4 }}>
                {isMissionFormRetrieve(data) && (
                    <EditBaseMissionForm
                        data={data}
                        missionId={missionId}
                        save={save}
                        redirectBackUrl={redirectBackUrl}
                    />
                )}
                {isMissionOrgUnitTypeRetrieve(data) && (
                    <EditBaseMissionOrgUnitType
                        data={data}
                        missionId={missionId}
                        save={save}
                        redirectBackUrl={redirectBackUrl}
                    />
                )}
                {isMissionEntityTypeRetrieve(data) && (
                    <EditBaseMissionEntityType
                        data={data}
                        missionId={missionId}
                        save={save}
                        redirectBackUrl={redirectBackUrl}
                    />
                )}
            </MainWrapper>
        </>
    );
};
