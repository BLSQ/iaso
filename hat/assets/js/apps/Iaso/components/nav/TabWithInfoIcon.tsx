import React, {
    FunctionComponent,
    ReactNode,
    useCallback,
    useMemo,
} from 'react';
import { Tab, Tooltip } from '@mui/material';
import { makeStyles } from '@mui/styles';
import InfoIcon from '@mui/icons-material/Info';
import classnames from 'classnames';

export const useStyles = makeStyles(theme => ({
    tab: {
        '&.MuiTab-root': {
            display: 'inline-flex',
            flexDirection: 'row-reverse',
        },
    },
    tabError: {
        // color: `${theme.palette.error.main} !important`,
    },
    tabDisabled: {
        cursor: 'default',
    },
    tabIcon: {
        position: 'relative',
        top: 3,
        left: theme.spacing(0.5),
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
    // passed from Mui Tabs component
    ...props
}) => {
    const classes: Record<string, string> = useStyles();
    // Remove onChange to avoid bugs when tab is disabled
    const filteredProps = useMemo(() => {
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { onChange, ...rest } = props;
        return rest;
    }, [props]);
    const onChange = useCallback(() => {
        if (!disabled) {
            handleChange(undefined, value);
        }
    }, [disabled, handleChange, value]);
    return (
        // @ts-ignore
        <Tab
            label={title}
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
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...filteredProps}
            onClick={onChange}
        />
    );
};
