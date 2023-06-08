import React, {
    FunctionComponent,
    useState,
    MouseEvent,
    ReactNode,
} from 'react';
import { makeStyles, Theme } from '@material-ui/core/styles';
import {
    Popper,
    Box,
    IconButton,
    Paper,
    PopperPlacementType,
} from '@material-ui/core';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import CancelOutlinedIcon from '@material-ui/icons/CancelOutlined';

const useStyles = makeStyles((theme: Theme) => ({
    popper: {
        zIndex: 1300,
    },
    closeButton: {
        position: 'absolute',
        right: 0,
        top: 0,
    },
    paper: {
        padding: theme.spacing(1, 3, 2, 2),
        backgroundColor: theme.palette.grey['200'],
        maxWidth: 300,
    },
}));

type Props = {
    children: ReactNode;
    placement?: PopperPlacementType;
};

export const InfoPopper: FunctionComponent<Props> = ({
    children,
    placement = 'right-start',
}) => {
    const classes = useStyles();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleClick = (event: MouseEvent<HTMLElement>) => {
        setAnchorEl(anchorEl ? null : event.currentTarget);
    };

    const open = Boolean(anchorEl);
    return (
        <Box>
            <IconButton onClick={handleClick}>
                <InfoOutlinedIcon color="primary" />
            </IconButton>
            <Popper
                popperOptions={{
                    modifiers: {
                        offset: {
                            offset: '5,5',
                        },
                    },
                }}
                className={classes.popper}
                open={open}
                anchorEl={anchorEl}
                placement={placement}
            >
                <IconButton
                    size="small"
                    onClick={handleClick}
                    className={classes.closeButton}
                >
                    <CancelOutlinedIcon color="primary" fontSize="small" />
                </IconButton>
                <Paper className={classes.paper} elevation={1}>
                    {children}
                </Paper>
            </Popper>
        </Box>
    );
};
