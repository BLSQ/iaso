import React, { FunctionComponent } from 'react';

import { Box, Grid } from '@mui/material';
import MESSAGES from './messages';

import { CreateBudgetProcessModal } from './BudgetProcess/CreateBudgetProcessModal';
import { CsvButton } from '../../../../../../hat/assets/js/apps/Iaso/components/Buttons/CsvButton';

type Props = {
    csvUrl: string;
    isUserPolioBudgetAdmin: boolean;
    isMobileLayout?: boolean;
};

export const BudgetButtons: FunctionComponent<Props> = ({
    csvUrl,
    isUserPolioBudgetAdmin,
    isMobileLayout = false,
}) => {
    return (
        <Grid container justifyContent="flex-end">
            {isUserPolioBudgetAdmin && (
                <Box mb={isMobileLayout ? 2 : 0}>
                    <CreateBudgetProcessModal
                        iconProps={{
                            message: MESSAGES.createBudgetProcessTitle,
                        }}
                    />
                </Box>
            )}
            <CsvButton csvUrl={csvUrl} />
        </Grid>
    );
};
