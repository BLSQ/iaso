import React, { FunctionComponent } from 'react';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { Box, Grid, makeStyles } from '@material-ui/core';
import { Router } from '../../../../../../../../hat/assets/js/apps/Iaso/types/general';
import MESSAGES from '../../../../constants/messages';
import TopBar from '../../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { Nopv2AuthorisationsDetailsTable } from './Nopv2AuthorisationsDetailsTable';
import { useGoBack } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/useGoBack';
import { NOPV2_AUTH } from '../../../../constants/routes';
import { CreateAuthorisationModal } from './Modals/CreateEdit/CreateEditAuthorisationModal';

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
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.nopv2Auth)}
                displayBackButton
                goBack={goBack}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Grid container item justifyContent="flex-end">
                    <CreateAuthorisationModal
                        // The both props cannot actually be undefined
                        // It's a problem with the typing of Router
                        // @ts-ignore
                        countryName={router.params.countryName}
                        // @ts-ignore
                        countryId={router.params.country}
                    />
                </Grid>
                <Nopv2AuthorisationsDetailsTable params={router.params} />
            </Box>
        </>
    );
};
