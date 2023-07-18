import React, { FunctionComponent } from 'react';
import { TableRow, TableCell, Box } from '@material-ui/core';
import {
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';

import { FilteredDistricts } from './types';
import MESSAGES from '../../constants/messages';

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
                <Box textAlign="center" width="100%">
                    {isFetching && formatMessage(MESSAGES.loading)}
                    {!isFetching &&
                        filteredDistricts?.length === 0 &&
                        formatMessage(MESSAGES.noOptions)}
                </Box>
            </TableCell>
        </TableRow>
    );
};
