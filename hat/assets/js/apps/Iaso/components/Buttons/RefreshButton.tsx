import React, { FunctionComponent } from 'react';
import { Box, Button } from '@mui/material';
import Autorenew from '@mui/icons-material/Autorenew';
import {
    LoadingSpinner,
    commonStyles,
    useSafeIntl,
} from 'bluesquare-components';
import { makeStyles } from '@mui/styles';
import { defineMessages } from 'react-intl';

const useStyles = makeStyles(theme => ({
    buttonIcon: { ...commonStyles(theme).buttonIcon },
}));

const MESSAGES = defineMessages({
    refresh: {
        defaultMessage: 'Refresh',
        id: 'iaso.label.refresh',
    },
});

type Props = {
    forceRefresh: () => void;
    disabled?: boolean;
    withLoadingSpinner?: boolean;
    isLoading?: boolean;
};

export const RefreshButton: FunctionComponent<Props> = ({
    forceRefresh,
    disabled = false,
    withLoadingSpinner = false,
    isLoading = false,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    return (
        <Box display="flex" justifyContent="flex-end">
            <Button
                id="refresh-button"
                variant="contained"
                color="primary"
                onClick={forceRefresh}
                disabled={disabled}
            >
                <Autorenew className={classes.buttonIcon} />
                {formatMessage(MESSAGES.refresh)}
                {disabled && withLoadingSpinner && isLoading && (
                    <LoadingSpinner
                        size={16}
                        absolute
                        fixed={false}
                        transparent
                    />
                )}
            </Button>
        </Box>
    );
};
