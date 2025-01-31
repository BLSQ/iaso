import { Box, Typography } from '@mui/material';
import React, { FC } from 'react';

interface UserTabProps {
    currentUser: any; // You can replace 'any' with your specific user type
    setFieldValue: (key: string, value: any) => void;
    // Add any other props you need
}

export const UserTab: FC<UserTabProps> = ({ currentUser, setFieldValue }) => {
    console.log('currentUser', currentUser);
    return (
        <Box>
            <Typography>CECI VIENt DE REGISTRY</Typography>
            {/* Use your props here */}
        </Box>
    );
};
