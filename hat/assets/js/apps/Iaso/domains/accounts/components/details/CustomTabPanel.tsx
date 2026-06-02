import React from 'react';
import { Box } from '@mui/material';
import { BoxProps } from '@mui/material/Box/Box';

type TabPanelProps = {
    children?: React.ReactNode;
    index: string;
    value: string;
} & Omit<BoxProps, 'role' | 'hidden' | 'id' | 'aria-labelledby'>;

export const CustomTabPanel = (props: TabPanelProps) => {
    const { children, value, index, ...other } = props;

    return (
        <Box
            role="tabpanel"
            hidden={value !== index}
            id={`account-tabpanel-${index}`}
            aria-labelledby={`account-tab-${index}`}
            {...other}
        >
            {value === index && children}
        </Box>
    );
};
