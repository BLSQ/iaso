import React, { FunctionComponent } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    useTheme,
} from '@mui/material';
import { IconButton, useSafeIntl } from 'bluesquare-components';
import { Instance } from '../types/instance';
import MESSAGES from '../messages';
import { baseUrls } from '../../../constants/urls';
import { colorCodes } from '../../orgUnits/reviewChanges/Components/ReviewOrgUnitChangesInfos';

type Props = {
    currentInstance: Instance;
};
const InstanceDetailsChangeRequests: FunctionComponent<Props> = ({
    currentInstance,
}) => {
    const { formatMessage } = useSafeIntl();
    const theme = useTheme();
    return (
        <TableContainer style={{ width: '100%' }}>
            <Table size="small" aria-label="simple table">
                <TableHead>
                    <TableRow>
                        <TableCell>{formatMessage(MESSAGES.status)}</TableCell>
                        <TableCell>{formatMessage(MESSAGES.view)}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {currentInstance?.change_requests?.map(changeRequest => {
                        const statusColor =
                            changeRequest && colorCodes[changeRequest.status]
                                ? `${colorCodes[changeRequest.status]}`
                                : 'inherit';

                        return (
                            <TableRow key={changeRequest.id}>
                                <TableCell
                                    sx={{
                                        color: theme.palette[statusColor].main,
                                    }}
                                >
                                    {formatMessage(
                                        MESSAGES[changeRequest.status],
                                    )}
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        url={`/${baseUrls.orgUnitsChangeRequestDetail}/changeRequestId/${changeRequest.id}`}
                                        icon="remove-red-eye"
                                        tooltipMessage={MESSAGES.status}
                                    />
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default InstanceDetailsChangeRequests;
