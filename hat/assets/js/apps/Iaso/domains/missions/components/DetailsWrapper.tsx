import React from 'react';
import { Paper } from '@mui/material';
import { GreyPageWrapper } from 'Iaso/components/GreyPageWrapper';

type Props = {
    children: React.ReactNode;
    title: string;
    actions?: React.ReactNode;
};

export const DetailsWrapper: React.FC<Props> = ({
    children,
    title,
    actions,
}) => (
    <GreyPageWrapper title={title} actions={actions} maxWidth="md">
        <Paper>{children}</Paper>
    </GreyPageWrapper>
);
