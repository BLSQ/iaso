import React from 'react';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import {
    Button,
    ButtonGroup,
    ClickAwayListener,
    Grow,
    MenuItem,
    MenuItemProps,
    MenuList,
    Popper,
} from '@mui/material';
import Paper from '@mui/material/Paper';

export type Options = {
    text: string;
} & MenuItemProps &
    Partial<HTMLAnchorElement>;

export type DropdownSampleDownloadProps = {
    buttonText: string;
    options: Options[];
};
export const DropdownSampleDownload = ({
    options,
    buttonText,
}: DropdownSampleDownloadProps) => {
    const [open, setOpen] = React.useState(false);
    const anchorRef = React.useRef<HTMLDivElement>(null);

    const handleToggle = () => {
        setOpen(prevOpen => !prevOpen);
    };

    const handleClose = (event: Event) => {
        if (
            anchorRef.current &&
            anchorRef.current.contains(event.target as HTMLElement)
        ) {
            return;
        }

        setOpen(false);
    };

    const htmlId = React.useId();

    return (
        <React.Fragment>
            <ButtonGroup
                variant="contained"
                ref={anchorRef}
                aria-label={buttonText}
            >
                <Button
                    aria-controls={open ? htmlId : undefined}
                    aria-expanded={open ? 'true' : undefined}
                    aria-haspopup="menu"
                    onClick={handleToggle}
                >
                    {buttonText}
                </Button>
                <Button
                    size="small"
                    aria-controls={open ? htmlId : undefined}
                    aria-expanded={open ? 'true' : undefined}
                    aria-label={buttonText}
                    aria-haspopup="menu"
                    onClick={handleToggle}
                >
                    <ArrowDropDownIcon />
                </Button>
            </ButtonGroup>
            <Popper
                sx={{ zIndex: 1 }}
                open={open}
                anchorEl={anchorRef.current}
                role={undefined}
                transition
                disablePortal
            >
                {({ TransitionProps, placement }) => (
                    <Grow
                        {...TransitionProps}
                        style={{
                            transformOrigin:
                                placement === 'bottom'
                                    ? 'center top'
                                    : 'center bottom',
                        }}
                    >
                        <Paper>
                            <ClickAwayListener onClickAway={handleClose}>
                                <MenuList id={htmlId} autoFocusItem>
                                    {options?.map(option => {
                                        const {
                                            text,
                                            onClick: optionOnClick,
                                            ...otherOptions
                                        } = option;
                                        return (
                                            <MenuItem
                                                key={text}
                                                onClick={e => {
                                                    setOpen(false);
                                                    if (optionOnClick) {
                                                        optionOnClick(e);
                                                    }
                                                }}
                                                {...otherOptions}
                                            >
                                                {text}
                                            </MenuItem>
                                        );
                                    })}
                                </MenuList>
                            </ClickAwayListener>
                        </Paper>
                    </Grow>
                )}
            </Popper>
        </React.Fragment>
    );
};
