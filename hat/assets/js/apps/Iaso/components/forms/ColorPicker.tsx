import React, { FunctionComponent, useMemo, useState } from 'react';
import {
    FormLabel,
    Box,
    Tooltip,
    ClickAwayListener,
    TooltipProps,
} from '@mui/material';

import { TwitterPicker } from 'react-color';
import { FormattedMessage, defineMessages } from 'react-intl';
import { useGetColors } from 'Iaso/hooks/useGetColors';
import { SxStyles } from '../../types/general';

const MESSAGES = defineMessages({
    color: {
        defaultMessage: 'Color',
        id: 'iaso.label.color',
    },
});

const styles: SxStyles = {
    button: {
        // @ts-ignore
        border: theme => `3px solid ${theme.palette.ligthGray.border}`,
        borderRadius: theme => theme.spacing(3),
        width: theme => theme.spacing(3),
        height: theme => theme.spacing(3),
        cursor: 'pointer',
        display: 'inline-block',
        outline: 'none !important',
    },
    tooltip: {
        backgroundColor: '#fff',
        padding: 0,
        maxWidth: 'none',
        boxShadow: theme => theme.shadows[8],
        '& .twitter-picker': {
            width: '420px !important',
            boxShadow: 'none !important',
            '& div div:nth-last-child(2), & div div:nth-last-child(3)': {
                display: 'none !important',
            },
        },
    },
    arrow: {
        color: '#fff',
    },
};

type Props = {
    currentColor: string;
    onChangeColor: (color: string) => void;
    displayLabel?: boolean;
    placement?: TooltipProps['placement'];
    colors?: string[];
};

export const ColorPicker: FunctionComponent<Props> = ({
    currentColor,
    onChangeColor,
    displayLabel = true,
    placement = 'bottom-start',
    colors,
}) => {
    const [open, setOpen] = useState(false);
    const { data: apiColors } = useGetColors();

    const handleClick = () => {
        setOpen(prev => !prev);
    };

    const handleChangeColor = newColor => {
        setOpen(false);
        onChangeColor(newColor.hex);
    };

    const handleClickAway = () => {
        if (open) {
            setOpen(false);
        }
    };
    const displayedColors = useMemo(
        () =>
            (colors ? colors : (apiColors ?? [])).filter(
                color => color.toLowerCase() !== currentColor.toLowerCase(),
            ),
        [colors, apiColors, currentColor],
    );
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
                <ClickAwayListener onClickAway={handleClickAway}>
                    <div>
                        <Tooltip
                            open={open}
                            arrow
                            placement={placement}
                            disableHoverListener
                            disableFocusListener
                            disableTouchListener
                            slotProps={{
                                tooltip: { sx: styles.tooltip },
                                arrow: { sx: styles.arrow },
                            }}
                            title={
                                <TwitterPicker
                                    width="100%"
                                    colors={displayedColors}
                                    color={currentColor}
                                    onChangeComplete={handleChangeColor}
                                    triangle="hide"
                                />
                            }
                        >
                            <Box
                                component="span"
                                onClick={handleClick}
                                sx={{
                                    ...styles.button,
                                    backgroundColor: currentColor,
                                }}
                                role="button"
                                tabIndex={0}
                            >
                                {' '}
                            </Box>
                        </Tooltip>
                    </div>
                </ClickAwayListener>
            </Box>
        </Box>
    );
};
