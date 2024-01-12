/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Card, CardContent, Box, Typography } from '@mui/material';
import MESSAGES from '../messages';
import { OrgUnitChangeRequestDetails } from '../types';

type Props = {
    changeRequest: OrgUnitChangeRequestDetails;
};

export const ReviewOrgUnitChangesComment: FunctionComponent<Props> = ({
    changeRequest,
}) => {
    const { formatMessage } = useSafeIntl();

    return (
        <Box display="flex" justifyContent="flex-end">
            <Card
                sx={{
                    backgroundColor: 'error.background',
                    color: 'error.main',
                    mt: 2,
                    width: '50%',
                }}
            >
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        {formatMessage(MESSAGES.comment)}:
                    </Typography>
                    <Typography>{changeRequest.rejection_comment}</Typography>
                </CardContent>
            </Card>
        </Box>
    );
};
