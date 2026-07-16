import React from 'react';
import { SaveOutlined } from '@mui/icons-material';
import { Box, Button, Paper } from '@mui/material';
import { Typography } from '@mui/material';
import { LinkButton, useSafeIntl } from 'bluesquare-components';
import { MainWrapper } from 'Iaso/components/MainWrapper';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../messages';

const MAX_WIDTH = '800px';

const styles: SxStyles = {
    root: {
        backgroundColor: theme => theme.palette.background.blueGrey,
    },
    paper: {
        maxWidth: MAX_WIDTH,
        margin: '0 auto',
    },
    headerContainer: {
        borderBottom: theme => `1px solid ${theme.palette.divider}`,
        paddingBottom: theme => theme.spacing(2),
        marginBottom: theme => theme.spacing(4),
    },
    header: {
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        maxWidth: MAX_WIDTH,
        margin: theme => `${theme.spacing(2)} auto 0 auto`,
    },
};
type Props = {
    children: React.ReactNode;
    showHeader?: boolean;
    cancelUrl?: string;
    allowConfirm?: boolean;
    handleSubmit?: () => void;
    title?: string;
};

export const DetailsWrapper: React.FC<Props> = ({
    children,
    showHeader = false,
    cancelUrl,
    title,
    allowConfirm,
    handleSubmit,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <MainWrapper sx={styles.root}>
            {showHeader && (
                <Box sx={styles.headerContainer}>
                    <Box sx={styles.header}>
                        {title && <Typography variant="h6">{title}</Typography>}
                        <Box>
                            {cancelUrl && (
                                <LinkButton
                                    to={cancelUrl}
                                    color="primary"
                                    variant="outlined"
                                >
                                    {formatMessage(MESSAGES.cancel)}
                                </LinkButton>
                            )}
                            <Button
                                variant="contained"
                                type="submit"
                                color="primary"
                                disabled={!allowConfirm}
                                sx={{ ml: 2 }}
                                onClick={() => allowConfirm && handleSubmit?.()}
                            >
                                <SaveOutlined sx={{ mr: 1 }} />
                                {formatMessage(MESSAGES.save)}
                            </Button>
                        </Box>
                    </Box>
                </Box>
            )}
            <Paper sx={styles.paper}>{children}</Paper>
        </MainWrapper>
    );
};
