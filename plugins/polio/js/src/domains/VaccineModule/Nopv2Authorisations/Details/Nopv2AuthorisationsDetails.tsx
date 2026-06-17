import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl, useGoBack } from 'bluesquare-components';
import { DisplayIfUserHasPerm } from '../../../../../../../../hat/assets/js/apps/Iaso/components/DisplayIfUserHasPerm';
import TopBar from '../../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { useParamsObject } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject';
import MESSAGES from '../../../../constants/messages';
import { VACCINE_AUTH_ADMIN } from '../../../../constants/permissions';
import { baseUrls } from '../../../../constants/urls';
import { CreateAuthorisationModal } from './Modals/CreateEdit/CreateEditAuthorisationModal';
import { Nopv2AuthorisationsDetailsTable } from './Nopv2AuthorisationsDetailsTable';

const useStyles = makeStyles(theme => ({ ...commonStyles(theme) }));

type Params = {
    country?: string;
    countryName?: string;
    order?: string;
    pageSize?: string;
    page?: string;
};

export const Nopv2AuthorisationsDetails: FunctionComponent = () => {
    const params = useParamsObject(baseUrls.nopv2AuthDetails) as Params;
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const goBack = useGoBack(baseUrls.nopv2Auth);
    return (
        <>
            <TopBar
                title={`${formatMessage(MESSAGES.nopv2Auth)} - ${
                    params.countryName
                }`}
                displayBackButton
                goBack={goBack}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <DisplayIfUserHasPerm permissions={[VACCINE_AUTH_ADMIN]}>
                    <Grid container sx={{
                        justifyContent: "flex-end"
                    }}>
                        <CreateAuthorisationModal
                            countryName={params.countryName}
                            countryId={params.country}
                            iconProps={{
                                message: MESSAGES.addAuthorisation,
                            }}
                        />
                    </Grid>
                </DisplayIfUserHasPerm>
                <Nopv2AuthorisationsDetailsTable params={params} />
            </Box>
        </>
    );
};
