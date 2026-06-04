import React from 'react';
import { Grid, GridProps } from '@mui/material';

type TabPanelProps = {
    children?: React.ReactNode;
    index: string;
    value: string;
} & Omit<GridProps, 'role' | 'hidden' | 'id' | 'aria-labelledby'>;

export const CustomTabPanel = (props: TabPanelProps) => {
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
