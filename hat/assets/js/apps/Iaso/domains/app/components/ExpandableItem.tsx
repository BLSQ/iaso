import React, {
    FunctionComponent,
    ReactChildren,
    ReactNode,
    useState,
} from 'react';
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
    children: ReactChildren | ReactNode;
    label: string;
    preventCollapse?: boolean;
    titleColor?:
        | 'initial'
        | 'primary'
        | 'secondary'
        | 'inherit'
        | 'textPrimary'
        | 'textSecondary'
        | 'error'
        | undefined;
    titleVariant?:
        | 'h1'
        | 'h2'
        | 'h3'
        | 'h4'
        | 'h5'
        | 'h6'
        | 'subtitle1'
        | 'subtitle2'
        | 'body1'
        | 'body2'
        | 'caption'
        | 'button'
        | 'overline'
        | 'srOnly'
        | 'inherit';
    backgroundColor?: string;
};

export const ExpandableItem: FunctionComponent<Props> = ({
    openOnMount = false,
    children,
    label,
    preventCollapse = false,
    titleVariant = 'body1',
    titleColor = 'initial',
    backgroundColor = 'transparent',
}) => {
    const [open, setOpen] = useState<boolean>(openOnMount);
    return (
        <>
            <ListItem
                style={{ backgroundColor }}
                button
                onClick={() => {
                    setOpen(value => !value);
                }}
                disableRipple={preventCollapse}
            >
                <ListItemText>
                    <Typography variant={titleVariant} color={titleColor}>
                        {label}
                    </Typography>
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
