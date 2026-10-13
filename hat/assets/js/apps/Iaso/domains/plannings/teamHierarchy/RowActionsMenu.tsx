import React, { FC, MouseEvent, ReactNode, useCallback, useState } from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
    IconButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../messages';

const styles = {
    danger: {
        color: 'error.main',
        '& .MuiListItemIcon-root': { color: 'error.main' },
    },
} satisfies SxStyles;

export type RowAction = {
    key: string;
    label: string;
    icon: ReactNode;
    onClick: () => void;
    disabled?: boolean;
    danger?: boolean;
};

type Props = {
    actions: (RowAction | false)[];
};

const isRowAction = (action: RowAction | false): action is RowAction =>
    Boolean(action);

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
                {actions.filter(isRowAction).map(action => (
                    <MenuItem
                        key={action.key}
                        disabled={action.disabled}
                        sx={action.danger ? styles.danger : undefined}
                        onClick={() => {
                            closeMenu();
                            action.onClick();
                        }}
                    >
                        <ListItemIcon>{action.icon}</ListItemIcon>
                        <ListItemText>{action.label}</ListItemText>
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};
