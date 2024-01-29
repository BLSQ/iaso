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
    const baseStyle = useMemo(
        () => ({
            borderBottom: 'none',
            p: 0.25,
        }),
        [],
    );

    const infoCard = useMemo(
        () => ({
            fontSize: 14,
            backgroundColor: status
                ? `${colorCodes[status]}.background`
                : 'inherit',
        }),
        [status],
    );

    const cardContent = useMemo(
        () => ({
            px: 2,
            pt: theme => `${theme.spacing(1)} !important}`,
            pb: theme => `${theme.spacing(1)} !important}`,
        }),
        [],
    );

    const label = useMemo(
        () => ({
            ...baseStyle,
            fontWeight: 'bold',
            textAlign: 'right',
        }),
        [baseStyle],
    );

    const value = useMemo(
        () => ({
            ...baseStyle,
            textAlign: 'left',
        }),
        [baseStyle],
    );

    const statusStyle = useMemo(
        () => ({
            ...baseStyle,
            textAlign: 'left',
            color: status ? `${colorCodes[status]}.main` : 'inherit',
        }),
        [status, baseStyle],
    );

    return { infoCard, cardContent, label, value, status: statusStyle };
};

export const ReviewOrgUnitChangesInfos: FunctionComponent<Props> = ({
    changeRequest,
    isFetchingChangeRequest,
}) => {
    const { formatMessage } = useSafeIntl();
    const styles = useStatusStyles(changeRequest?.status);
    if (isFetchingChangeRequest || !changeRequest) return null;
    const { status } = changeRequest;
    return (
        <Card sx={styles.infoCard}>
            <CardContent sx={styles.cardContent}>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={styles.label}>
                                {formatMessage(MESSAGES.status)}:
                            </TableCell>
                            <TableCell sx={styles.status}>
                                {formatMessage(MESSAGES[status])}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={styles.label}>
                                {formatMessage(MESSAGES.updated_at)}:
                            </TableCell>
                            <TableCell sx={styles.value}>
                                {DateTimeCell({
                                    value: changeRequest.updated_at,
                                })}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={styles.label}>
                                {formatMessage(MESSAGES.created_at)}:
                            </TableCell>
                            <TableCell sx={styles.value}>
                                {DateTimeCell({
                                    value: changeRequest.created_at,
                                })}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={styles.label}>
                                {formatMessage(MESSAGES.updated_by)}:
                            </TableCell>
                            <TableCell sx={styles.value}>
                                <UserCell value={changeRequest.updated_by} />
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={styles.label}>
                                {formatMessage(MESSAGES.created_by)}:
                            </TableCell>
                            <TableCell sx={styles.value}>
                                <UserCell value={changeRequest.created_by} />
                            </TableCell>
                        </TableRow>

                        {changeRequest.status === 'rejected' && (
                            <TableRow>
                                <TableCell sx={styles.label}>
                                    {formatMessage(MESSAGES.comment)}:
                                </TableCell>
                                <TableCell sx={styles.value}>
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
