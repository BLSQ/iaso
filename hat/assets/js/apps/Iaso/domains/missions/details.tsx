import React from 'react';
import { Box, Grid, Stack, Theme } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
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
import MESSAGES from './messages';
import {
    isMissionEntityTypeRetrieve,
    isMissionFormRetrieve,
    isMissionOrgUnitTypeRetrieve,
} from './utils';

const baseRedirectUrl = `${baseUrls.missions}`;
const useStyles = makeStyles((theme: Theme) => ({ ...commonStyles(theme) }));

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
                    <Grid container spacing={2} sx={{ width: '100%' }}>
                        <Grid item xs={12} sm={6}>
                            {isMissionFormRetrieve(data) && (
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
                    <Grid container spacing={2} sx={{ mt: 2, width: '100%' }}>
                        <Grid item xs={12} sm={9}>
                            <FormWidgetPaper mission={data} />
                        </Grid>
                    </Grid>
                </Stack>
            </Box>
        </>
    );
};
