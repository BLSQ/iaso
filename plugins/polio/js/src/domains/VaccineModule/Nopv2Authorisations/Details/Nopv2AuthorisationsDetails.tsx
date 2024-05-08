import React, { FunctionComponent } from 'react';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { DisplayIfUserHasPerm } from '../../../../../../../../hat/assets/js/apps/Iaso/components/DisplayIfUserHasPerm';
import { useParamsObject } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject';
import { VACCINE_AUTH_ADMIN } from '../../../../constants/permissions';
import TopBar from '../../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { Nopv2AuthorisationsDetailsTable } from './Nopv2AuthorisationsDetailsTable';
import { useGoBack } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useGoBack';
import { CreateAuthorisationModal } from './Modals/CreateEdit/CreateEditAuthorisationModal';
import { baseUrls } from '../../../../constants/urls';
import MESSAGES from '../../../../constants/messages';

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
                    <Grid container item justifyContent="flex-end">
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
