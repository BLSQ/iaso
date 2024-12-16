import InfoIcon from '@mui/icons-material/Info';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    useTheme,
} from '@mui/material';
import { IconButton, useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { baseUrls } from '../../../constants/urls';
import { colorCodes } from '../../orgUnits/reviewChanges/Components/ReviewOrgUnitChangesInfos';
import MESSAGES from '../messages';
import { Instance } from '../types/instance';

type Props = {
    currentInstance: Instance;
    disabled?: boolean;
};
const InstanceDetailsChangeRequests: FunctionComponent<Props> = ({
    currentInstance,
    disabled = false,
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
                                        color: disabled
                                            ? theme.palette.text.disabled
                                            : theme.palette[statusColor].main,
                                    }}
                                >
                                    {formatMessage(
                                        MESSAGES[changeRequest.status],
                                    )}
                                </TableCell>
                                <TableCell>
                                    {!disabled && (
                                        <IconButton
                                            url={`/${baseUrls.orgUnitsChangeRequestDetail}/changeRequestId/${changeRequest.id}`}
                                            icon="remove-red-eye"
                                            tooltipMessage={MESSAGES.status}
                                        />
                                    )}
                                    {disabled && (
                                        <Tooltip
                                            title={formatMessage(
                                                MESSAGES.disabledReason,
                                            )}
                                            arrow
                                        >
                                            <InfoIcon
                                                color="primary"
                                                sx={{
                                                    cursor: 'pointer',
                                                }}
                                            />
                                        </Tooltip>
                                    )}
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
