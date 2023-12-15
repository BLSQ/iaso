import React, { FunctionComponent, ReactNode, useCallback } from 'react';
import { Tab, Tooltip, makeStyles } from '@material-ui/core';
import InfoIcon from '@material-ui/icons/Info';
import classnames from 'classnames';

export const useStyles = makeStyles(theme => ({
    tab: {
        '& .MuiTab-wrapper': {
            display: 'flex',
            flexDirection: 'row-reverse',
        },
    },
    tabError: {
        color: `${theme.palette.error.main} !important`,
    },
    tabDisabled: {
        // color: `${theme.palette.text.disabled} !important`,
        cursor: 'default',
    },
    tabIcon: {
        position: 'relative',
        top: 1,
        left: theme.spacing(0.5),
        // color: theme.palette.primary.main,
        cursor: 'pointer',
    },
}));

type Tab = {
    title: string;
    form: ReactNode;
    hasTabError: boolean;
    key: string;
    disabled?: boolean;
};

type Props = {
    value: number | string;
    title: string;
    hasTabError: boolean;
    disabled: boolean;
    // eslint-disable-next-line no-unused-vars
    handleChange: (_event: any, newValue: number | string) => void;
    showIcon: boolean;
    tooltipMessage: string;
};

export const TabWithInfoIcon: FunctionComponent<Props> = ({
    value,
    title,
    hasTabError,
    disabled,
    handleChange,
    tooltipMessage,
    showIcon = false,
}) => {
    const classes: Record<string, string> = useStyles();
    const onChange = useCallback(() => {
        if (!disabled) {
            handleChange(undefined, value);
        }
    }, [disabled, handleChange, value]);
    return (
        <Tab
            label={title}
            onClick={onChange}
            className={classnames(
                classes.tab,
                hasTabError && classes.tabError,
                disabled && classes.tabDisabled,
            )}
            disableFocusRipple={disabled}
            disableRipple={disabled}
            icon={
                (showIcon && (
                    <Tooltip title={tooltipMessage}>
                        <InfoIcon
                            fontSize="small"
                            className={classes.tabIcon}
                        />
                    </Tooltip>
                )) || <></>
            }
        />
    );
};
