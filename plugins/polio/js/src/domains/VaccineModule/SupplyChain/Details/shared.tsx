import React, { FunctionComponent, ReactNode } from 'react';
import { Box, Grid, Typography, makeStyles } from '@material-ui/core';
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
