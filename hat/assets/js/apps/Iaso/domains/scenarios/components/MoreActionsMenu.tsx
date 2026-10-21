import React, { FunctionComponent, useState } from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { IconButton, Menu } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';
import { ImportScenariosButton } from './ImportScenariosButton';

/** The "⋮" menu of the scenario list: what isn't done every day (import scenario files). */
export const MoreActionsMenu: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    const [anchor, setAnchor] = useState<HTMLElement | null>(null);
    return (
        <>
            <IconButton
                aria-label={formatMessage(MESSAGES.moreActions)}
                aria-haspopup="menu"
                onClick={event => setAnchor(event.currentTarget)}
            >
                <MoreVertIcon />
            </IconButton>
            <Menu
                anchorEl={anchor}
                open={Boolean(anchor)}
                onClose={() => setAnchor(null)}
                keepMounted
            >
                <ImportScenariosButton
                    asMenuItem
                    onClick={() => setAnchor(null)}
                />
            </Menu>
        </>
    );
};
