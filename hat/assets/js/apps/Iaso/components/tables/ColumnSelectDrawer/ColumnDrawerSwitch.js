import React from 'react';
import { Switch, ListItemText, Tooltip } from '@material-ui/core';
import { string, bool, func, oneOfType, object } from 'prop-types';
import { truncateText } from 'bluesquare-components';

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
                    'data-test-column-switch': secondaryText,
                }}
                className={className}
            />
            <Tooltip
                title={toolTipTitle}
                placement="left-start"
                components={{ Tooltip: 'div' }}
            >
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
ColumnDrawerSwitch.propTypes = {
    disabled: bool,
    onChange: func,
    className: string,
    checked: bool,
    toolTipTitle: oneOfType([string, object]).isRequired,
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
