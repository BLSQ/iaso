import { HelpOutline } from '@mui/icons-material';
import { Box, IconButton, List, ListItem, Paper, Popper } from '@mui/material';
import { red } from '@mui/material/colors';
import React, { useState } from 'react';

type Props = {
    errors: string[];
    errorCountMessage: string;
};

export const ErrorsPopper: React.FC<Props> = ({
    errors,
    errorCountMessage,
}) => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(anchorEl ? null : event.currentTarget);
    };

    const open = Boolean(anchorEl);

    if (!errors || errors.length === 0) return null;

    return (
        <Box display="flex" alignItems="center">
            <Box
                sx={{
                    color: theme => theme.palette.error.main,
                    fontSize: '13px',
                    ml: '14px',
                }}
            >
                {errorCountMessage}
            </Box>
            <IconButton
                onClick={handleClick}
                size="small"
                aria-describedby={open ? 'errors-popper' : undefined}
            >
                <HelpOutline fontSize="small" color="error" />
            </IconButton>
            <Popper
                id="errors-popper"
                open={open}
                anchorEl={anchorEl}
                placement="right"
                sx={{ zIndex: theme => theme.zIndex.tooltip }}
                modifiers={[
                    {
                        name: 'offset',
                        options: {
                            offset: [0, 8],
                        },
                    },
                ]}
            >
                <Paper
                    sx={{
                        p: 1,
                        maxHeight: 300,
                        overflow: 'auto',
                        bgcolor: red[50],
                    }}
                >
                    <List dense>
                        {errors.map(error => (
                            <ListItem
                                key={error}
                                sx={{
                                    color: theme => theme.palette.error.main,
                                }}
                            >
                                {error.charAt(0).toUpperCase() + error.slice(1)}
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            </Popper>
        </Box>
    );
};
