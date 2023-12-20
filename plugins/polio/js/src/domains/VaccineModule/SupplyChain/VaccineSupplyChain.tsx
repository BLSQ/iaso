import React, { FunctionComponent } from 'react';
import { AddButton, useSafeIntl } from 'bluesquare-components';
import { Box, Grid } from '@mui/material';
import { useDispatch } from 'react-redux';
import { userHasPermission } from '../../../../../../../hat/assets/js/apps/Iaso/domains/users/utils';
import { POLIO_SUPPLY_CHAIN_WRITE } from '../../../../../../../hat/assets/js/apps/Iaso/utils/permissions';
import { useCurrentUser } from '../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import { redirectTo } from '../../../../../../../hat/assets/js/apps/Iaso/routing/actions';
import { Router } from '../../../../../../../hat/assets/js/apps/Iaso/types/general';
import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { useStyles } from '../../../styles/theme';
import MESSAGES from './messages';
import { VaccineSupplyChainTable } from './Table/VaccineSupplyChainTable';
import { VaccineSupplyChainFilters } from './Filters/VaccineSupplyChainFilters';
import { VACCINE_SUPPLY_CHAIN_DETAILS } from '../../../constants/routes';

type Props = { router: Router };

export const VaccineSupplyChain: FunctionComponent<Props> = ({ router }) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const dispatch = useDispatch();
    const currentUser = useCurrentUser();
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.vaccineSupplyChain)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <VaccineSupplyChainFilters params={router.params} />
                {userHasPermission(POLIO_SUPPLY_CHAIN_WRITE, currentUser) && (
                    <Grid container justifyContent="flex-end">
                        <Box mt={2}>
                            <AddButton
                                onClick={() =>
                                    dispatch(
                                        redirectTo(
                                            VACCINE_SUPPLY_CHAIN_DETAILS,
                                            {},
                                        ),
                                    )
                                }
                            />
                        </Box>
                    </Grid>
                )}
                <VaccineSupplyChainTable params={router.params} />
            </Box>
        </>
    );
};
