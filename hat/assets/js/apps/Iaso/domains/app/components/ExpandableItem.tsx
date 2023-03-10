import React, { FunctionComponent, ReactNode, useState } from 'react';
import {
    Collapse,
    ListItem,
    ListItemText,
    Typography,
} from '@material-ui/core';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';

type Props = {
    openOnMount?: boolean;
    children: ReactNode;
    label: string;
    preventCollapse?: boolean;
};

export const ExpandableItem: FunctionComponent<Props> = ({
    openOnMount = false,
    children,
    label,
    preventCollapse = false,
}) => {
    const [open, setOpen] = useState<boolean>(openOnMount);
    return (
        <>
            <ListItem
                button
                onClick={() => {
                    setOpen(value => !value);
                }}
                disableRipple={preventCollapse}
            >
                <ListItemText>
                    <Typography>{label}</Typography>
                </ListItemText>
                {(open || preventCollapse) && <ExpandLess />}
                {!open && !preventCollapse && <ExpandMore />}
            </ListItem>
            <Collapse in={open || preventCollapse} timeout="auto" unmountOnExit>
                {children}
            </Collapse>
        </>
    );
};
