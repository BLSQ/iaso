import React from 'react';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Button from '@mui/material/Button';

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
