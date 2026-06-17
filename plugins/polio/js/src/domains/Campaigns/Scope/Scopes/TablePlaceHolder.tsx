import React, { FunctionComponent } from 'react';
import { TableRow, TableCell, Box } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';

import MESSAGES from '../../../../constants/messages';
import { FilteredDistricts } from './types';

type Props = {
    isFetching: boolean;
    filteredDistricts?: FilteredDistricts[];
};

export const TablePlaceHolder: FunctionComponent<Props> = ({
    isFetching,
    filteredDistricts,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <TableRow>
            <TableCell colSpan={5}>
                <Box
                    sx={{
                        textAlign: 'center',
                        width: '100%',
                    }}
                >
                    {isFetching && formatMessage(MESSAGES.loading)}
                    {!isFetching &&
                        filteredDistricts?.length === 0 &&
                        formatMessage(MESSAGES.noOptions)}
                </Box>
            </TableCell>
        </TableRow>
    );
};
