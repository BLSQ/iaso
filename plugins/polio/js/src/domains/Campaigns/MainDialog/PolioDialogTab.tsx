import InfoIcon from '@mui/icons-material/Info';
import { Tab, Tooltip } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent, ReactNode, useCallback } from 'react';

import classnames from 'classnames';
import MESSAGES from '../../../constants/messages';
import { useStyles } from '../../../styles/theme';

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
    const isScopeOrSubactivitiesTab =
        title === formatMessage(MESSAGES.scope) ||
        title === formatMessage(MESSAGES.subActivities);

    const tooltipMessage =
        title === formatMessage(MESSAGES.scope)
            ? formatMessage(MESSAGES.scopeUnlockConditions)
            : formatMessage(MESSAGES.subActivitiesUnlockConditions);
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
            iconPosition="end"
            icon={
                (disabled && isScopeOrSubactivitiesTab && (
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
