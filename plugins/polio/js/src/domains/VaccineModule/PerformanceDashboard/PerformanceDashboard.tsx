import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';
import {
    useSafeIntl,
    UrlParams,
} from 'bluesquare-components';
import { DisplayIfUserHasPerm } from '../../../../../../../hat/assets/js/apps/Iaso/components/DisplayIfUserHasPerm';
import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { useParamsObject } from '../../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject';
import {
    POLIO_PERFORMANCE_ADMIN_PERMISSION,
    POLIO_PERFORMANCE_NON_ADMIN_PERMISSION,
} from '../../../constants/permissions';
import { baseUrls } from '../../../constants/urls';
import { useStyles } from '../../../styles/theme';
import { PerformanceDashboardFilters } from './filters/PerformanceDashboardFilters';
import MESSAGES from './messages';
import { CreatePerformanceModal } from './modals/CreateEditModal';
import { PerformanceDashboardTable } from './table/PerformanceDashboardTable';

type PerformanceDashboardParams = {
    country?: string;
    country_blocks?: string;
} & Partial<UrlParams>;

export const PerformanceDashboard: FunctionComponent = () => {
    const params = useParamsObject(
        baseUrls.performanceDashboard,
    ) as PerformanceDashboardParams;
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.performanceDashboard)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <PerformanceDashboardFilters params={params} />
                <DisplayIfUserHasPerm
                    permissions={[
                        POLIO_PERFORMANCE_ADMIN_PERMISSION,
                        POLIO_PERFORMANCE_NON_ADMIN_PERMISSION,
                    ]}
                >
                    <Grid container justifyContent="flex-end">
                        <Box mt={2}>
                            <CreatePerformanceModal />
                        </Box>
                    </Grid>
                </DisplayIfUserHasPerm>
                <PerformanceDashboardTable params={params} />
            </Box>
        </>
    );
};
