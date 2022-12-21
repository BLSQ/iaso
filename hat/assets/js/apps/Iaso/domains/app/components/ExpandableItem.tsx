import React, { FunctionComponent, ReactChildren, useState } from 'react';
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
    children: ReactChildren;
    label: string;
};

export const ExpandableItem: FunctionComponent<Props> = ({
    openOnMount = false,
    children,
    label,
}) => {
    const [open, setOpen] = useState<boolean>(openOnMount);
    return (
        <>
            <ListItem button onClick={() => setOpen(value => !value)}>
                <ListItemText>
                    <Typography>{label}</Typography>
                </ListItemText>
                {open && <ExpandLess />}
                {!open && <ExpandMore />}
            </ListItem>
            <Collapse in={open} timeout="auto" unmountOnExit>
                {children}
            </Collapse>
        </>
    );
};
