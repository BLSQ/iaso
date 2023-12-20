import React, { FunctionComponent, ChangeEvent, ReactElement } from 'react';
import { Switch, ListItemText, Tooltip } from '@mui/material';
// @ts-ignore
import { truncateText } from 'bluesquare-components';

type Props = {
    disabled: boolean;
    // eslint-disable-next-line no-unused-vars
    onChange?: (event: ChangeEvent<HTMLInputElement>, checked: boolean) => void;
    className: string;
    checked: boolean;
    toolTipTitle: string | ReactElement;
    primaryText: string;
    secondaryText: string;
    size?: 'small' | 'medium' | undefined;
};

export const ColumnDrawerSwitch: FunctionComponent<Props> = ({
    disabled,
    onChange = () => null,
    className,
    checked,
    toolTipTitle,
    primaryText,
    secondaryText,
    size = 'small',
}) => {
    return (
        <>
            <Switch
                disabled={disabled}
                size={size}
                checked={checked}
                onChange={onChange}
                color="primary"
                inputProps={{
                    'aria-label': primaryText,
                    // @ts-ignore
                    'data-test-column-switch': secondaryText,
                }}
                className={className}
            />
            <Tooltip title={toolTipTitle} placement="left-start">
                <ListItemText
                    style={{
                        cursor: 'default',
                    }}
                    primary={truncateText(primaryText, 33)}
                    secondary={truncateText(secondaryText, 35)}
                />
            </Tooltip>
        </>
    );
};
