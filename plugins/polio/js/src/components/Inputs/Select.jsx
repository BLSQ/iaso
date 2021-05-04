import {
    FormControl,
    InputLabel,
    MenuItem,
    Select as MUISelect,
} from '@material-ui/core';

import { TextInput } from './TextInput';
import get from 'lodash.get';

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
