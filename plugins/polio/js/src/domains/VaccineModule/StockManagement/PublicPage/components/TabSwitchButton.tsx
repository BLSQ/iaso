import React, { FunctionComponent, useCallback } from 'react';
import { Button } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';

type Props = {
    tab: 'usable' | 'unusable';
    activeTab: 'usable' | 'unusable';
    onClick: (_event, newTab) => void;
};

export const TabSwitchButton: FunctionComponent<Props> = ({
    tab,
    onClick,
    activeTab,
}) => {
    const { formatMessage } = useSafeIntl();
    const isActive = activeTab === tab;
    const handleClick = useCallback(
        _e => {
            if (activeTab !== tab) {
                onClick(_e, tab);
            }
        },
        [activeTab, onClick, tab],
    );

    return (
        <Button
            sx={{
                backgroundColor: isActive ? 'black' : 'white',
                color: isActive ? 'white' : 'black',
                boxShadow: 'none',
                borderRadius: 0,
                border: '1px solid black',
            }}
            onClick={handleClick}
            variant="contained"
        >
            {formatMessage(MESSAGES[tab])}
        </Button>
    );
};
