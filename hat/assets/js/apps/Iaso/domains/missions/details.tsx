import React from 'react';
import { Box, Grid, Stack } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    LoadingSpinner,
    useRedirectTo,
    useSafeIntl,
} from 'bluesquare-components';
import {
    MissionEntityTypeRetrieve,
    MissionFormRetrieve,
    MissionOrgUnitTypeRetrieve,
    MissionTypeValueEnum,
    useApiMicroplanningMissionsRetrieve,
} from 'Iaso/api/missions';
import Page404 from 'Iaso/components/errors/Page404';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { GeneralInfoWidgetPaper as GeneralInfoWidgetPaperMissionEntityType } from 'Iaso/domains/missions/components/details/missionEntityType/GeneralInfoWidgetPaper';
import { GeneralInfoWidgetPaper as GeneralInfoWidgetPaperMissionForm } from 'Iaso/domains/missions/components/details/missionForm/GeneralInfoWidgetPaper';
import { GeneralInfoWidgetPaper as GeneralInfoWidgetPaperMissionOrgUnitType } from 'Iaso/domains/missions/components/details/missionOrgUnitType/GeneralInfoWidgetPaper';
import { TopActions } from 'Iaso/domains/missions/components/details/TopActions';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { FormWidgetPaper } from './components/details/FormWidgetPaper';
import MESSAGES from './messages';

const baseRedirectUrl = `${baseUrls.missions}`;
const useStyles = makeStyles(theme => ({ ...commonStyles(theme) }));

function isMissionForm(data: any): data is MissionFormRetrieve {
    return data?.mission_type?.value === MissionTypeValueEnum.enum.FORM_FILLING;
}

function isMissionEntityTypeRetrieve(
    data: any,
): data is MissionEntityTypeRetrieve {
    return (
        data?.mission_type?.value === MissionTypeValueEnum.enum.ENTITY_AND_FORM
    );
}

function isMissionOrgUnitTypeRetrieve(
    data: any,
): data is MissionOrgUnitTypeRetrieve {
    return (
        data?.mission_type?.value ===
        MissionTypeValueEnum.enum.ORG_UNIT_AND_FORM
    );
}

export const MissionDetail = () => {
    const params = useParamsObject(baseUrls.missionsDetails);
    const classes = useStyles();
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
            <Box className={`${classes.containerFullHeightNoTabPadded}`}>
                <Stack spacing={2}>
                    <Box pt={4} px={2}>
                        <Stack
                            direction="row"
                            spacing={2}
                            justifyContent="flex-end"
                        >
                            <TopActions
                                missionId={missionId}
                                missionName={data.name}
                            />
                        </Stack>
                    </Box>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            {isMissionForm(data) && (
                                <GeneralInfoWidgetPaperMissionForm
                                    mission={data}
                                />
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
                        </Grid>
                    </Grid>
                    <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={12} sm={9}>
                            <FormWidgetPaper mission={data} />
                        </Grid>
                    </Grid>
                </Stack>
            </Box>
        </>
    );
};
