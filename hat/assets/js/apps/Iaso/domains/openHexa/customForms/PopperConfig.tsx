import React, { FunctionComponent, useCallback, useState } from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
    Popper,
    Paper,
    // MenuList,
    // MenuItem,
    IconButton as MuiIconButton,
    ClickAwayListener,
} from '@mui/material';

type Props = {
    index: number;
};

export const PopperConfig: FunctionComponent<Props> = ({ index }) => {
    // State for managing popper
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [openPopperIndex, setOpenPopperIndex] = useState<number | null>(null);

    // Popper handlers
    const handlePopperOpen = useCallback(
        (event: React.MouseEvent<HTMLElement>, index: number) => {
            setAnchorEl(event.currentTarget);
            setOpenPopperIndex(index);
        },
        [],
    );

    const handlePopperClose = useCallback(() => {
        setAnchorEl(null);
        setOpenPopperIndex(null);
    }, []);

    return (
        <>
            <MuiIconButton
                onClick={event => handlePopperOpen(event, index)}
                size="small"
            >
                <MoreVertIcon />
            </MuiIconButton>
            <Popper
                open={openPopperIndex === index}
                anchorEl={anchorEl}
                placement="right"
                sx={{ zIndex: 1300 }}
            >
                <ClickAwayListener onClickAway={handlePopperClose}>
                    <Paper sx={{ p: 2 }}>
                        ICI
                        {/* <MenuList>
                                            <MenuItem
                                                onClick={handlePopperClose}
                                            >
                                                {formatMessage(
                                                    MESSAGES.duplicateLevel,
                                                )}
                                            </MenuItem>
                                            <MenuItem
                                                onClick={handlePopperClose}
                                            >
                                                {formatMessage(MESSAGES.moveUp)}
                                            </MenuItem>
                                            <MenuItem
                                                onClick={handlePopperClose}
                                            >
                                                {formatMessage(
                                                    MESSAGES.moveDown,
                                                )}
                                            </MenuItem>
                                        </MenuList> */}
                    </Paper>
                </ClickAwayListener>
            </Popper>
        </>
    );
};
