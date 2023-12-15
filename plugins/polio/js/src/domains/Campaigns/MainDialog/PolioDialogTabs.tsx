import React, { FunctionComponent } from 'react';
import { Tab, Tabs } from '@material-ui/core';
import { useStyles } from '../../../styles/theme';
import { PolioDialogTab } from './PolioDialogTab';

export type Tab = {
    title: string;
    form: FunctionComponent;
    hasTabError: boolean;
    key: string;
    disabled?: boolean;
};

type Props = {
    selectedTab: number;
    // eslint-disable-next-line no-unused-vars
    handleChange: (_event: any, newValue: number) => void;
    tabs: Tab[];
};

export const PolioDialogTabs: FunctionComponent<Props> = ({
    selectedTab,
    handleChange,
    tabs,
}) => {
    const classes: Record<string, string> = useStyles();

    return (
        <Tabs
            value={selectedTab}
            className={classes.tabs}
            textColor="primary"
            aria-label="disabled tabs example"
            variant="scrollable"
            scrollButtons="auto"
        >
            {tabs.map(
                (
                    { title, disabled = false, hasTabError = false, key },
                    index,
                ) => (
                    <PolioDialogTab
                        key={key}
                        title={title}
                        disabled={disabled}
                        hasTabError={hasTabError}
                        handleChange={handleChange}
                        value={index}
                    />
                ),
            )}
        </Tabs>
    );
};
