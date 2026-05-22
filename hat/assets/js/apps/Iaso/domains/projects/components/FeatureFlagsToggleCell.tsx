import React from 'react';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { Button } from '@mui/material';

type Props = {
    collapsed: boolean;
    onToggle: (number) => void;
};

export const FeatureFlagToggleCell: React.FunctionComponent<Props> = ({
    collapsed = false,
    onToggle,
}) => {
    return (
        <Button
            variant="text"
            onClick={onToggle}
            data-test="featureFlag-toggle"
        >
            {collapsed ? <ExpandMore /> : <ExpandLess />}
        </Button>
    );
};
