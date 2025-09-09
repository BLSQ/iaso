import { ListItemText, Switch, Tooltip } from '@mui/material';
import { truncateText } from 'bluesquare-components';
import React, { ChangeEvent, FunctionComponent, ReactElement } from 'react';

type Props = {
    disabled: boolean;
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
