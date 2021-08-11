import React from 'react';
import { MenuItem } from '@material-ui/core';

import { TextInput } from './TextInput';

export const Select = ({ options = [], ...props }) => {
    return (
        <TextInput {...props} select>
            {options.map(option => (
                <MenuItem key={option.value} value={option.value}>
                    {option.label}
                </MenuItem>
            ))}
        </TextInput>
    );
};
