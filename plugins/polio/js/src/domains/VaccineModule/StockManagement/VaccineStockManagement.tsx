import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Box } from '@mui/material';
import { DisplayIfUserHasPerm } from '../../../../../../../hat/assets/js/apps/Iaso/components/DisplayIfUserHasPerm';
import {
    POLIO_VACCINE_STOCK_WRITE,
    POLIO_VACCINE_STOCK_READ,
} from '../../../../../../../hat/assets/js/apps/Iaso/utils/permissions';
import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { useStyles } from '../../../styles/theme';
import MESSAGES from './messages';
import { VaccineStockManagementFilters } from './Filters/VaccineStockManagementFilters';
import { VaccineStockManagementTable } from './Table/VaccineStockManagementTable';
import { StockManagementListParams } from './types';
import { CreateVaccineStock } from './CreateVaccineStock/CreateVaccineStock';
import { useParamsObject } from '../../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject';
import { baseUrls } from '../../../constants/urls';

export const VaccineStockManagement: FunctionComponent = () => {
    const params = useParamsObject(
        baseUrls.stockManagement,
    ) as StockManagementListParams;
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.vaccineStockManagement)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <VaccineStockManagementFilters params={params} />
                <DisplayIfUserHasPerm
                    permissions={[
                        POLIO_VACCINE_STOCK_WRITE,
                        POLIO_VACCINE_STOCK_READ,
                    ]}
                >
                    <Box mt={2} justifyContent="flex-end" display="flex">
                        <CreateVaccineStock iconProps={{}} />
                    </Box>
                </DisplayIfUserHasPerm>
                <VaccineStockManagementTable params={params} />
            </Box>
        </>
    );
};
