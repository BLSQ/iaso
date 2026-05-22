import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';
import InputComponent from './InputComponent';
import { IntlMessage } from 'bluesquare-components';

type Checkbox = {
    keyValue: string;
    label: IntlMessage | undefined;
    value: unknown;
    onChange: (arg0: any) => void;
};

type Props = {
    checkboxes: Checkbox[];
    inline?: boolean;
};

export const Checkboxes: FunctionComponent<Props> = ({
    checkboxes,
    inline = false,
}) => {
    const style = inline ? { display: 'inlineFlex' } : { display: 'grid' };
    const boxes = checkboxes.map((checkbox: Checkbox) => (
        <InputComponent
            key={checkbox.keyValue}
            keyValue={checkbox.keyValue}
            label={checkbox.label}
            value={checkbox.value}
            onChange={(_, value) => {
                checkbox.onChange(value);
            }}
            type="checkbox"
            clearable={false}
        />
    ));

    return <Box style={{ ...style }}>{boxes}</Box>;
};
