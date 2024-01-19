import React, { FunctionComponent, useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Card, CardContent, Grid } from '@mui/material';

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
                backgroundColor: status
                    ? `${colorCodes[status]}.background`
                    : 'inherit',
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
    return (
        <Card sx={styles.infoCard}>
            <CardContent>
                <Grid container spacing={1}>
                    <Grid item xs={4} sx={styles.label}>
                        {formatMessage(MESSAGES.status)}:
                    </Grid>
                    <Grid item xs={8} sx={styles.status}>
                        {formatMessage(MESSAGES[status])}
                    </Grid>

                    <Grid item xs={4} sx={styles.label}>
                        {formatMessage(MESSAGES.created_at)}:
                    </Grid>
                    <Grid item xs={8} sx={styles.value}>
                        {DateTimeCell({ value: changeRequest.created_at })}
                    </Grid>

                    <Grid item xs={4} sx={styles.label}>
                        {formatMessage(MESSAGES.created_by)}:
                    </Grid>
                    <Grid item xs={8} sx={styles.value}>
                        <UserCell value={changeRequest.created_by} />
                    </Grid>

                    <Grid item xs={4} sx={styles.label}>
                        {formatMessage(MESSAGES.updated_at)}:
                    </Grid>
                    <Grid item xs={8} sx={styles.value}>
                        {DateTimeCell({ value: changeRequest.updated_at })}
                    </Grid>

                    <Grid item xs={4} sx={styles.label}>
                        {formatMessage(MESSAGES.updated_by)}:
                    </Grid>
                    <Grid item xs={8} sx={styles.value}>
                        <UserCell value={changeRequest.updated_by} />
                    </Grid>

                    {changeRequest.status === 'rejected' && (
                        <>
                            <Grid item xs={4} sx={styles.label}>
                                {formatMessage(MESSAGES.comment)}:
                            </Grid>
                            <Grid item xs={8} sx={styles.value}>
                                {changeRequest.rejection_comment}
                            </Grid>
                        </>
                    )}
                </Grid>
            </CardContent>
        </Card>
    );
};
