import { useState } from 'react';

type PopoverParams = {
    open: boolean;
    // eslint-disable-next-line no-unused-vars
    handlePopoverOpen: (event: any) => void;
    handlePopoverClose: () => void;
};

export const usePopover = (): PopoverParams => {
    const [anchorEl, setAnchorEl] = useState(null);

    const handlePopoverOpen = event => {
        setAnchorEl(event.currentTarget);
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    return {
        open,
        handlePopoverClose,
        handlePopoverOpen,
    };
};
