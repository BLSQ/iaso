import React, { FC, MouseEvent, useCallback, useState } from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { IconButton, Menu, MenuItem } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';

export type RowAction = {
    key: string;
    label: string;
    onClick: () => void;
};

type Props = {
    actions: RowAction[];
};

export const RowActionsMenu: FC<Props> = ({ actions }) => {
    const { formatMessage } = useSafeIntl();
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const openMenu = useCallback(
        (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget),
        [],
    );
    const closeMenu = useCallback(() => setAnchorEl(null), []);

    return (
        <>
            <IconButton
                size="small"
                onClick={openMenu}
                aria-label={formatMessage(MESSAGES.moreActions)}
            >
                <MoreVertIcon fontSize="small" />
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={closeMenu}
            >
                {actions.map(action => (
                    <MenuItem
                        key={action.key}
                        onClick={() => {
                            closeMenu();
                            action.onClick();
                        }}
                    >
                        {action.label}
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};
