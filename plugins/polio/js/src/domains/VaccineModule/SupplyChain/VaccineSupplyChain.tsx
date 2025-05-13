import React, { FunctionComponent } from 'react';
import { AddButton, useSafeIntl, useRedirectTo } from 'bluesquare-components';
import { Box, Grid } from '@mui/material';
import { useParamsObject } from '../../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject';
import { DisplayIfUserHasPerm } from '../../../../../../../hat/assets/js/apps/Iaso/components/DisplayIfUserHasPerm';
import {
    POLIO_SUPPLY_CHAIN_READ,
    POLIO_SUPPLY_CHAIN_WRITE,
    POLIO_SUPPLY_CHAIN_READ_ONLY,
} from '../../../../../../../hat/assets/js/apps/Iaso/utils/permissions';
import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { useStyles } from '../../../styles/theme';
import MESSAGES from './messages';
import { VaccineSupplyChainTable } from './Table/VaccineSupplyChainTable';
import { VaccineSupplyChainFilters } from './Filters/VaccineSupplyChainFilters';
import { baseUrls } from '../../../constants/urls';

export const VaccineSupplyChain: FunctionComponent = () => {
    const params = useParamsObject(baseUrls.vaccineSupplyChain);
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const redirectTo = useRedirectTo();
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.vaccineSupplyChain)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <VaccineSupplyChainFilters params={params} />
                <DisplayIfUserHasPerm
                    permissions={[
                        POLIO_SUPPLY_CHAIN_WRITE,
                        POLIO_SUPPLY_CHAIN_READ,
                    ]}
                >
                    <Grid container justifyContent="flex-end">
                        <Box mt={2}>
                            <AddButton
                                onClick={() =>
                                    redirectTo(
                                        baseUrls.vaccineSupplyChainDetails,
                                    )
                                }
                            />
                        </Box>
                    </Grid>
                </DisplayIfUserHasPerm>
                <VaccineSupplyChainTable params={params} />
            </Box>
        </>
    );
};
