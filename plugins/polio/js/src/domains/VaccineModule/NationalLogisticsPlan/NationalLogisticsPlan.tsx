import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';
import { useSafeIntl, UrlParams } from 'bluesquare-components';
import { DisplayIfUserHasPerm } from '../../../../../../../hat/assets/js/apps/Iaso/components/DisplayIfUserHasPerm';
import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { useParamsObject } from '../../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject';
import {
    POLIO_COUNTRY_PLAN_ADMIN_PERMISSION,
    POLIO_COUNTRY_PLAN_NON_ADMIN_PERMISSION,
} from '../../../constants/permissions';
import { baseUrls } from '../../../constants/urls';
import { useStyles } from '../../../styles/theme';
import { NationalLogisticsPlanFilters } from './filters/NationalLogisticsPlanFilters';
import MESSAGES from './messages';
import { CreateNationalLogisticsPlanModal } from './modals/CreateEditModal';
import { NationalLogisticsPlanTable } from './table/NationalLogisticsPlanTable';

type nationalLogisticsPlanParams = {
    country?: string;
    country_blocks?: string;
} & Partial<UrlParams>;

export const NationalLogisticsPlan: FunctionComponent = () => {
    const params = useParamsObject(
        baseUrls.nationalLogisticsPlan,
    ) as nationalLogisticsPlanParams;
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.nationalLogisticsPlan)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <NationalLogisticsPlanFilters params={params} />
                <DisplayIfUserHasPerm
                    permissions={[
                        POLIO_COUNTRY_PLAN_ADMIN_PERMISSION,
                        POLIO_COUNTRY_PLAN_NON_ADMIN_PERMISSION,
                    ]}
                >
                    <Grid container justifyContent="flex-end">
                        <Box mt={2}>
                            <CreateNationalLogisticsPlanModal iconProps={{}} />
                        </Box>
                    </Grid>
                </DisplayIfUserHasPerm>
                <NationalLogisticsPlanTable params={params} />
            </Box>
        </>
    );
};
