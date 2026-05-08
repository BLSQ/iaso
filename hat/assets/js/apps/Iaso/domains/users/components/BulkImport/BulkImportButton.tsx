import React from 'react';
import { Box, Button, Tooltip } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    LoadingSpinner,
    useSafeIntl,
} from 'bluesquare-components';
import { useIsMutating } from 'react-query';
import MESSAGES from '../../messages';

const useStyles = makeStyles(theme => ({ ...commonStyles(theme) }));

type Props = {
    onClick: () => void;
    disabled: boolean;
};

export const BulkImportButton = ({ onClick, disabled }: Props) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const isMutating = useIsMutating();
    const tooltipTitle = isMutating
        ? formatMessage(MESSAGES.backendIsBusy)
        : '';
    return (
        <Tooltip title={tooltipTitle}>
            {/* The Box is necessary to show the tooltip when the Button is disabled */}
            <Box>
                <Button
                    onClick={onClick}
                    type={'submit'}
                    disabled={disabled || Boolean(isMutating)}
                    color="primary"
                    variant="contained"
                    className={classes.button}
                >
                    {formatMessage(MESSAGES.submit)}
                    {Boolean(isMutating) && (
                        <LoadingSpinner
                            size={16}
                            absolute
                            fixed={false}
                            transparent
                        />
                    )}
                </Button>
            </Box>
        </Tooltip>
    );
};
