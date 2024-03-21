import React, { FunctionComponent } from 'react';

import { Box, Grid } from '@mui/material';
import MESSAGES from './messages';

import { CreateBudgetProcessModal } from './BudgetProcess/CreateBudgetProcessModal';
import { CsvButton } from '../../../../../../hat/assets/js/apps/Iaso/components/Buttons/CsvButton';

type Props = { csvUrl: string; isUserPolioBudgetAdmin: boolean };

export const BudgetButtons: FunctionComponent<Props> = ({
    csvUrl,
    isUserPolioBudgetAdmin,
}) => {
    return (
        <Grid container justifyContent="flex-end">
            {isUserPolioBudgetAdmin && (
                <Box mr={2}>
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
