import React from 'react';
import { Switch, ListItemText, Tooltip } from '@material-ui/core';
import { string, bool, func } from 'prop-types';
import { truncateText } from 'bluesquare-components/dist/utils';

export const ColumnDrawerSwitch = ({
    disabled,
    onChange,
    className,
    checked,
    toolTipTitle,
    primaryText,
    secondaryText,
    size,
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
                }}
                className={className}
            />
            <Tooltip title={toolTipTitle} placement="left-start">
                <ListItemText
                    style={{
                        cursor: 'default',
                    }}
                    primary={truncateText(primaryText, 40)}
                    secondary={secondaryText}
                />
            </Tooltip>
        </>
    );
};
ColumnDrawerSwitch.propTypes = {
    disabled: bool,
    onChange: func,
    className: string,
    checked: bool,
    toolTipTitle: string.isRequired,
    primaryText: string.isRequired,
    secondaryText: string,
    size: string,
};
ColumnDrawerSwitch.defaultProps = {
    disabled: false,
    onChange: () => null,
    className: '',
    checked: false,
    secondaryText: undefined,
    size: 'small',
};
