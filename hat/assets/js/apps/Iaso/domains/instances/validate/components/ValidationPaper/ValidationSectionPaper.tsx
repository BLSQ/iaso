import React, { FunctionComponent, ReactNode } from 'react';
import { Paper, SxProps, Theme } from '@mui/material';

const baseSx: SxProps<Theme> = {
    padding: theme => theme.spacing(2),
    margin: 0,
    overflow: 'auto',
    marginLeft: theme => theme.spacing(2),
    marginRight: theme => theme.spacing(2),
};

type Props = {
    children: ReactNode;
    withTopMargin?: boolean;
};

export const ValidationSectionPaper: FunctionComponent<Props> = ({
    children,
    withTopMargin = false,
}) => (
    <Paper
        elevation={1}
        sx={{
            ...baseSx,
            ...(withTopMargin && { marginTop: theme => theme.spacing(2) }),
        }}
    >
        {children}
    </Paper>
);
