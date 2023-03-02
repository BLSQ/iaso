/* eslint-disable react/jsx-props-no-spreading */
import React, { FunctionComponent, ReactNode } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { makeStyles, Tab, Tabs, Tooltip } from '@material-ui/core';
import { FormattedMessage } from 'react-intl';
import MESSAGES from '../../constants/messages';
import { useStyles } from '../../styles/theme';

type Props = {
    selectedTab: number;
    // eslint-disable-next-line no-unused-vars
    handleChange: (_event: any, newValue: number) => void;
    tabs: {
        title: string;
        form: ReactNode;
        hasTabError: boolean;
        key: string;
        disabled?: boolean;
    }[];
};

const useTabErrorStyles = makeStyles(theme => {
    return {
        tabError: {
            color: `${theme.palette.error.main} !important`,
        },
        pointer: {
            pointerEvents: 'auto',
        },
    };
});

export const PolioDialogTabs: FunctionComponent<Props> = ({
    selectedTab,
    handleChange,
    tabs,
}) => {
    const { formatMessage } = useSafeIntl();
    const tabErrorClasses = useTabErrorStyles();
    const classes: Record<string, string> = useStyles();
    return (
        <Tabs
            value={selectedTab}
            className={classes.tabs}
            textColor="primary"
            onChange={handleChange}
            aria-label="disabled tabs example"
            variant="scrollable"
            scrollButtons="auto"
        >
            {tabs.map(({ title, disabled, hasTabError = false, key }) => {
                if (disabled && title === formatMessage(MESSAGES.scope)) {
                    return (
                        <Tab
                            key={key}
                            classes={
                                hasTabError
                                    ? {
                                          textColorPrimary:
                                              tabErrorClasses.tabError,
                                          selected: tabErrorClasses.tabError,
                                      }
                                    : undefined
                            }
                            label={
                                <Tooltip
                                    key={key}
                                    title={
                                        <FormattedMessage
                                            {...MESSAGES.scopeUnlockConditions}
                                        />
                                    }
                                >
                                    <span>{title}</span>
                                </Tooltip>
                            }
                            disabled={disabled || false}
                        />
                    );
                }
                return (
                    <Tab
                        key={key}
                        label={title}
                        disabled={disabled || false}
                        classes={
                            hasTabError
                                ? {
                                      textColorPrimary:
                                          tabErrorClasses.tabError,
                                      selected: tabErrorClasses.tabError,
                                  }
                                : undefined
                        }
                    />
                );
            })}
        </Tabs>
    );
};
