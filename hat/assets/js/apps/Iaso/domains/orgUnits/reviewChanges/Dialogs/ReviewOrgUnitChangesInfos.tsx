import React, { FunctionComponent, useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import {
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableRow,
} from '@mui/material';

import MESSAGES from '../messages';
import {
    OrgUnitChangeRequestDetails,
    ChangeRequestValidationStatus,
} from '../types';
import { UserCell } from '../../../../components/Cells/UserCell';
import { DateTimeCell } from '../../../../components/Cells/DateTimeCell';

type Props = {
    changeRequest?: OrgUnitChangeRequestDetails;
    isFetchingChangeRequest: boolean;
};

export const colorCodes: Record<ChangeRequestValidationStatus, string> = {
    new: 'warning',
    rejected: 'error',
    approved: 'success',
};

const useStatusStyles = (status?: ChangeRequestValidationStatus) => {
    return useMemo(
        () => ({
            infoCard: {
                fontSize: 14,
                backgroundColor: status
                    ? `${colorCodes[status]}.background`
                    : 'inherit',
            },
            cardContent: {
                px: 2,
                pt: theme => `${theme.spacing(1)} !important}`,
                pb: theme => `${theme.spacing(1)} !important}`,
            },
            cell: {
                borderBottom: 'none',
                p: 0.25,
            },
            label: {
                fontWeight: 'bold',
                textAlign: 'right',
            },
            value: {
                textAlign: 'left',
            },
            status: {
                textAlign: 'left',
                color: status ? `${colorCodes[status]}.main` : 'inherit',
            },
        }),
        [status],
    );
};

export const ReviewOrgUnitChangesInfos: FunctionComponent<Props> = ({
    changeRequest,
    isFetchingChangeRequest,
}) => {
    const { formatMessage } = useSafeIntl();
    const styles = useStatusStyles(changeRequest?.status);
    if (isFetchingChangeRequest || !changeRequest) return null;
    const { status } = changeRequest;
    const labelStyle = { ...styles.label, ...styles.cell };
    const valueStyle = { ...styles.value, ...styles.cell };
    return (
        <Card sx={styles.infoCard}>
            <CardContent sx={styles.cardContent}>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={labelStyle}>
                                {formatMessage(MESSAGES.status)}:
                            </TableCell>
                            <TableCell
                                sx={{ ...styles.status, ...styles.cell }}
                            >
                                {formatMessage(MESSAGES[status])}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={labelStyle}>
                                {formatMessage(MESSAGES.updated_at)}:
                            </TableCell>
                            <TableCell sx={valueStyle}>
                                {DateTimeCell({
                                    value: changeRequest.updated_at,
                                })}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={labelStyle}>
                                {formatMessage(MESSAGES.created_at)}:
                            </TableCell>
                            <TableCell sx={valueStyle}>
                                {DateTimeCell({
                                    value: changeRequest.created_at,
                                })}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={labelStyle}>
                                {formatMessage(MESSAGES.updated_by)}:
                            </TableCell>
                            <TableCell sx={valueStyle}>
                                <UserCell value={changeRequest.updated_by} />
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={labelStyle}>
                                {formatMessage(MESSAGES.created_by)}:
                            </TableCell>
                            <TableCell sx={valueStyle}>
                                <UserCell value={changeRequest.created_by} />
                            </TableCell>
                        </TableRow>

                        {changeRequest.status === 'rejected' && (
                            <TableRow>
                                <TableCell sx={labelStyle}>
                                    {formatMessage(MESSAGES.comment)}:
                                </TableCell>
                                <TableCell sx={valueStyle}>
                                    {changeRequest.rejection_comment}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};
