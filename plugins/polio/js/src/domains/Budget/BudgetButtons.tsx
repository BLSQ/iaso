import React, { FunctionComponent } from 'react';

import { Box, Grid } from '@mui/material';
import MESSAGES from './messages';

import { CreateBudgetProcessModal } from './CreateBudgetProcess/CreateBudgetProcessModal';
import { CsvButton } from '../../../../../../hat/assets/js/apps/Iaso/components/Buttons/CsvButton';
import { useCurrentUser } from '../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import { userHasPermission } from '../../../../../../hat/assets/js/apps/Iaso/domains/users/utils';

type Props = { csvUrl: string };

export const BudgetButtons: FunctionComponent<Props> = ({ csvUrl }) => {
    const currentUser = useCurrentUser();
    const isUserAdmin = userHasPermission('iaso_polio_config', currentUser);
    return (
        <Grid container justifyContent="flex-end">
            {isUserAdmin && (
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
