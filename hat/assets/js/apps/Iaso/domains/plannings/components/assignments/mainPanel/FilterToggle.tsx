import React, { FC, ReactElement } from 'react';
import { IconButton, Tooltip } from '@mui/material';

type Props = {
    isOn: boolean;
    onToggle: () => void;
    // What clicking does, so it changes with the state.
    label: string;
    icon: ReactElement;
};

export const FilterToggle: FC<Props> = ({ isOn, onToggle, label, icon }) => (
    <Tooltip title={label}>
        <IconButton
            size="small"
            onClick={onToggle}
            color={isOn ? 'primary' : 'default'}
            aria-label={label}
            aria-pressed={isOn}
        >
            {icon}
        </IconButton>
    </Tooltip>
);
