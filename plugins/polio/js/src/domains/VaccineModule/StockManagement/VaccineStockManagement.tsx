import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Box } from '@mui/material';
import { Router } from '../../../../../../../hat/assets/js/apps/Iaso/types/general';
import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { useStyles } from '../../../styles/theme';
import MESSAGES from './messages';
import { VaccineStockManagementFilters } from './Filters/VaccineStockManagementFilters';
import { VaccineStockManagementTable } from './Table/VaccineStockManagementTable';
import { StockManagementListParams } from './types';
import { CreateVaccineStock } from './CreateVaccineStock/CreateVaccineStock';

type Props = { router: Router };

export const VaccineStockManagement: FunctionComponent<Props> = ({
    router,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.vaccineStockManagement)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <VaccineStockManagementFilters
                    params={router.params as StockManagementListParams}
                />
                <Box mt={2} justifyContent="flex-end" display="flex">
                    <CreateVaccineStock iconProps={{}} />
                </Box>
                <VaccineStockManagementTable
                    params={router.params as StockManagementListParams}
                />
            </Box>
        </>
    );
};
