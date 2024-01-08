import React, { FunctionComponent } from 'react';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { Router } from '../../../../../../../../hat/assets/js/apps/Iaso/types/general';
import MESSAGES from '../../../../constants/messages';
import TopBar from '../../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { Nopv2AuthorisationsDetailsTable } from './Nopv2AuthorisationsDetailsTable';
import { useGoBack } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/useGoBack';
import { NOPV2_AUTH } from '../../../../constants/routes';
import { CreateAuthorisationModal } from './Modals/CreateEdit/CreateEditAuthorisationModal';
import { userHasPermission } from '../../../../../../../../hat/assets/js/apps/Iaso/domains/users/utils';
import { useCurrentUser } from '../../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';

const useStyles = makeStyles(theme => ({ ...commonStyles(theme) }));

type Props = {
    router: Router;
};

export const Nopv2AuthorisationsDetails: FunctionComponent<Props> = ({
    router,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const goBack = useGoBack(router, NOPV2_AUTH);
    const currentUser = useCurrentUser();
    return (
        <>
            <TopBar
                title={`${formatMessage(MESSAGES.nopv2Auth)} - ${
                    router.params.countryName
                }`}
                displayBackButton
                goBack={goBack}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                {userHasPermission(
                    'iaso_polio_vaccine_authorizations_admin',
                    currentUser,
                ) && (
                    <Grid container item justifyContent="flex-end">
                        <CreateAuthorisationModal
                            // The both props cannot actually be undefined
                            // It's a problem with the typing of Router
                            // @ts-ignore
                            countryName={router.params.countryName}
                            // @ts-ignore
                            countryId={router.params.country}
                            iconProps={{ message: MESSAGES.addAuthorisation }}
                        />
                    </Grid>
                )}

                <Nopv2AuthorisationsDetailsTable params={router.params} />
            </Box>
        </>
    );
};
