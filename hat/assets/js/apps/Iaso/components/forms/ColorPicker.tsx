import React, { FunctionComponent, useState } from 'react';
import { FormLabel, Box, Popper, ClickAwayListener } from '@mui/material';

import { makeStyles } from '@mui/styles';
import { TwitterPicker } from 'react-color';
import { FormattedMessage, defineMessages } from 'react-intl';
import { chipColors } from 'Iaso/constants/chipColors';

const MESSAGES = defineMessages({
    color: {
        defaultMessage: 'Color',
        id: 'iaso.label.color',
    },
});

const useStyles = makeStyles(theme => ({
    button: {
        // @ts-ignore
        border: `3px solid ${theme.palette.ligthGray.border}`,
        borderRadius: theme.spacing(3),
        width: theme.spacing(3),
        height: theme.spacing(3),
        cursor: 'pointer',
        display: 'inline-block',
        outline: 'none !important',
    },
    popper: {
        zIndex: 1300,
        width: 300,
        paddingTop: theme.spacing(2),
        marginLeft: -10,
        '& .twitter-picker': {
            width: '350px !important',
            '& div div:nth-last-child(2), & div div:nth-last-child(3)': {
                display: 'none !important',
            },
        },
    },
}));

type Props = {
    currentColor: string;
    onChangeColor: (color: string) => void;
    colors?: string[];
    displayLabel?: boolean;
};

export const ColorPicker: FunctionComponent<Props> = ({
    currentColor,
    onChangeColor,
    colors = chipColors,
    displayLabel = true,
}) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const classes = useStyles();
    const handleClick = event => {
        setAnchorEl(anchorEl ? null : event.currentTarget);
    };
    const open = Boolean(anchorEl);

    const handleChangeColor = newColor => {
        handleClick(null);
        onChangeColor(newColor.hex);
    };
    return (
        <Box>
            <Box display="flex" alignItems="center">
                {displayLabel && (
                    <Box mr={1} display="inline-block">
                        <FormLabel>
                            <FormattedMessage {...MESSAGES.color} />:
                        </FormLabel>
                    </Box>
                )}
                <span
                    onClick={handleClick}
                    className={classes.button}
                    role="button"
                    tabIndex={0}
                    style={{ backgroundColor: currentColor }}
                >
                    {' '}
                </span>
            </Box>
            {open && (
                <ClickAwayListener onClickAway={handleClick}>
                    <Popper
                        id="color-picker"
                        open={open}
                        anchorEl={anchorEl}
                        placement="bottom-start"
                        className={classes.popper}
                    >
                        <TwitterPicker
                            width="100%"
                            colors={colors}
                            color={currentColor}
                            onChangeComplete={handleChangeColor}
                        />
                    </Popper>
                </ClickAwayListener>
            )}
        </Box>
    );
};
