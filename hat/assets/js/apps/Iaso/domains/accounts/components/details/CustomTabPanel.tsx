import React, { FunctionComponent } from 'react';
import Grid from '@mui/material/Grid/Grid';
import type { GridProps } from '@mui/material/Grid/Grid';

type TabPanelProps = {
    children?: React.ReactNode;
    index: string;
    value: string;
} & Omit<GridProps, 'role' | 'hidden' | 'id' | 'aria-labelledby'>;

export const CustomTabPanel: FunctionComponent<TabPanelProps> = props => {
    const { children, value, index, ...other } = props;

    return (
        <Grid
            container
            role="tabpanel"
            hidden={value !== index}
            id={`account-tabpanel-${index}`}
            aria-labelledby={`account-tab-${index}`}
            {...other}
        >
            {value === index && children}
        </Grid>
    );
};
