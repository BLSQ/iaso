import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
    FormLabel,
    Box,
    makeStyles,
    Popper,
    ClickAwayListener,
} from '@material-ui/core';
import { FormattedMessage, defineMessages } from 'react-intl';
import { TwitterPicker } from 'react-color';

import { chipColors } from '../../constants/chipColors';

const MESSAGES = defineMessages({
    color: {
        defaultMessage: 'Color',
        id: 'iaso.label.color',
    },
});

const useStyles = makeStyles(theme => ({
    button: {
        border: `3px solid ${theme.palette.ligthGray.border}`,
        borderRadius: theme.spacing(3),
        width: theme.spacing(3),
        height: theme.spacing(3),
        cursor: 'pointer',
        display: 'inline-block',
        position: 'relative',
        top: 6,
        left: theme.spacing(1),
        outline: 'none !important',
    },
    popper: {
        zIndex: 500,
        width: 300,
        paddingTop: theme.spacing(2),
        marginLeft: -5,
        '& .twitter-picker': {
            width: '350px !important',
            '& div div:nth-last-child(2), & div div:nth-last-child(3)': {
                display: 'none !important',
            },
        },
    },
}));

const ColorPicker = ({ currentColor, onChangeColor, colors, displayLabel }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const classes = useStyles();
    const handleClick = event => {
        setAnchorEl(anchorEl ? null : event.currentTarget);
    };
    const open = Boolean(anchorEl);
    return (
        <Box>
            <Box>
                {displayLabel && (
                    <FormLabel>
                        <FormattedMessage {...MESSAGES.color} />:
                    </FormLabel>
                )}
                <span
                    onClick={handleClick}
                    className={classes.button}
                    role="button"
                    tabIndex="0"
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
                            onChangeComplete={color => {
                                handleClick();
                                onChangeColor(color.hex.replace('#', ''));
                            }}
                        />
                    </Popper>
                </ClickAwayListener>
            )}
        </Box>
    );
};
ColorPicker.defaultProps = {
    colors: chipColors,
    displayLabel: true,
};

ColorPicker.propTypes = {
    currentColor: PropTypes.string.isRequired,
    onChangeColor: PropTypes.func.isRequired,
    colors: PropTypes.arrayOf(PropTypes.string),
    displayLabel: PropTypes.bool,
};
export { ColorPicker };
