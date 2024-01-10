import React, { FunctionComponent, ReactNode } from 'react';
import { Box, Grid, Theme, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    AddButton,
    IntlMessage,
    MENU_HEIGHT_WITH_TABS,
    useSafeIntl,
} from 'bluesquare-components';

export const useSharedStyles = makeStyles({
    scrollableForm: {
        height: `calc(100vh - ${MENU_HEIGHT_WITH_TABS + 200}px)`,
        overflow: 'scroll',
    },
});

type Props = {
    className?: string;
    onClick: () => void;
    children: ReactNode;
    titleMessage: IntlMessage;
    buttonMessage: IntlMessage;
};

export const MultiFormTab: FunctionComponent<Props> = ({
    className,
    onClick,
    children,
    titleMessage,
    buttonMessage,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useSharedStyles();
    return (
        <Box className={className}>
            <Box mb={4}>
                <Grid container justifyContent="space-between">
                    <Typography variant="h5">
                        {formatMessage(titleMessage)}
                    </Typography>
                    <Box mr={2}>
                        <AddButton message={buttonMessage} onClick={onClick} />
                    </Box>
                </Grid>
            </Box>
            <Box className={classes.scrollableForm}>{children}</Box>
        </Box>
    );
};
export const usePaperStyles = makeStyles((theme: Theme) => ({
    paper: {
        padding: theme.spacing(4, 2, 2, 4),
        marginBottom: theme.spacing(4),
        // @ts-ignore
        border: `1px solid ${theme.palette.mediumGray.main}`,
        width: 'calc(100% - 64px)',
        boxShadow:
            '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 1px 0px rgba(0,0,0,0.1)',
    },
    markedForDeletion: {
        '&  label.MuiInputLabel-root': {
            backgroundColor: `${theme.palette.grey['200']} !important`,
        },
        backgroundColor: theme.palette.grey['200'],
    },
    container: { display: 'inline-flex', width: '100%' },
}));
