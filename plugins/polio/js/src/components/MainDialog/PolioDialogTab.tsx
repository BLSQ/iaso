import React, { FunctionComponent, ReactNode, useCallback } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Tab, Tooltip } from '@material-ui/core';
import InfoIcon from '@material-ui/icons/Info';

import classnames from 'classnames';
import MESSAGES from '../../constants/messages';
import { useStyles } from '../../styles/theme';

type Tab = {
    title: string;
    form: ReactNode;
    hasTabError: boolean;
    key: string;
    disabled?: boolean;
};

type Props = {
    value: number;
    title: string;
    hasTabError: boolean;
    disabled: boolean;
    // eslint-disable-next-line no-unused-vars
    handleChange: (_event: any, newValue: number) => void;
};

export const PolioDialogTab: FunctionComponent<Props> = ({
    value,
    title,
    hasTabError,
    disabled,
    handleChange,
}) => {
    const { formatMessage } = useSafeIntl();
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
                (disabled && title === formatMessage(MESSAGES.scope) && (
                    <Tooltip
                        title={formatMessage(MESSAGES.scopeUnlockConditions)}
                    >
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
