import React, { FunctionComponent } from 'react';
import { Button, Typography, Box } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../messages';
import { SyncResponse } from '../../types/sync';

type Props = {
    jsonDiffResult?: SyncResponse;
    isDisabled: boolean;
    handleSeePreview: () => void;
};
export const ConfirmSyncPreview: FunctionComponent<Props> = ({
    jsonDiffResult,
    isDisabled,
    handleSeePreview,
}) => {
    const { formatMessage } = useSafeIntl();

    return (
        <>
            <Box display="flex" justifyContent="center" width="100%" my={2}>
                <Button
                    onClick={handleSeePreview}
                    color="primary"
                    variant="outlined"
                    disabled={isDisabled}
                >
                    {formatMessage(MESSAGES.syncPreview)}
                </Button>
            </Box>
            {jsonDiffResult && (
                <Box
                    sx={{
                        bgcolor: 'grey.200',
                        p: 2,
                        borderRadius: 1,
                        mb: 3,
                        textAlign: 'center',
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 4,
                            justifyContent: 'center',
                        }}
                    >
                        <Box>
                            <Typography variant="subtitle2">
                                {formatMessage(MESSAGES.count_create)}
                            </Typography>
                            <Typography variant="h4">
                                {jsonDiffResult.count_create}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="subtitle2">
                                {formatMessage(MESSAGES.count_update)}
                            </Typography>
                            <Typography variant="h4">
                                {jsonDiffResult.count_update}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            )}
            {!jsonDiffResult && (
                <Typography
                    variant="body2"
                    color="error"
                    component="span"
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        width: '100%',
                    }}
                >
                    {formatMessage(MESSAGES.syncMessage)}
                </Typography>
            )}
        </>
    );
};
