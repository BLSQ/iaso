import React, { FunctionComponent, ReactNode, useState } from 'react';
import Layers from '@mui/icons-material/Layers';
import { Box, SxProps, Typography } from '@mui/material';
import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import { IconButton, useSafeIntl } from 'bluesquare-components';
import classNames from 'classnames';

import MESSAGES from '../messages';
import TileSwitch from './TileSwitchComponent';

const useStyles = makeStyles(theme => ({
    legendLayers: {
        position: 'absolute',
        zIndex: 500,
        borderRadius: 4,
        border: '2px solid rgba(0,0,0,0.2)',
        minHeight: 28,
        minWidth: 28,
    },
    iconContainer: {
        position: 'absolute',
        paddingRight: theme.spacing(0.5),
        paddingTop: theme.spacing(1),
        top: 0,
        right: 0,
        backgroundColor: 'white',
    },
    barButton: {
        display: 'flex',
        position: 'absolute',
        backgroundColor: 'white',
        borderRadius: '4px',
        padding: '2px',
        cursor: 'pointer',
        outline: 'none',
        top: 0,
        right: 0,
        boxShadow: 'none',
        // @ts-ignore
        color: `${theme.textColor} !important`,
    },
    container: {
        backgroundColor: 'white',
        position: 'relative',
        transition: 'width .1s ease-in-out, height .1s ease-in-out',
        overflow: 'hidden',
    },
    open: {
        width: 235,
        height: 275,
    },
    closed: {
        width: 0,
        height: 0,
    },
    title: {
        paddingLeft: theme.spacing(1),
        paddingTop: theme.spacing(1),
    },
}));
export type Tile = {
    maxZoom: number;
    url: string;
    attribution?: string;
};

type Props = {
    styles?: SxProps<Theme>;
} & (
    | {
          currentTile: Tile;
          setCurrentTile: (newTile: Tile) => void;
          children?: never;
      }
    | {
          /** the list of basemaps to pick from, instead of the raster tiles of `constants/mapTiles` */
          children: ReactNode;
          currentTile?: never;
          setCurrentTile?: never;
      }
);

export const TilesSwitchControl: FunctionComponent<Props> = ({
    currentTile,
    setCurrentTile,
    children,
    styles = {
        top: (theme: Theme) => theme.spacing(1),
        right: (theme: Theme) => theme.spacing(1),
        left: 'auto',
        bottom: 'auto',
    },
}) => {
    const { formatMessage } = useSafeIntl();
    const [tilePopup, setTilePopup] = useState<boolean>(false);

    const classes: Record<string, string> = useStyles();

    const toggleTilePopup = () => {
        setTilePopup(!tilePopup);
    };

    return (
        <Box
            className={classNames(classes.legendLayers, 'tile-switch-control')}
            sx={styles}
        >
            {!tilePopup && (
                <span
                    className={classes.barButton}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleTilePopup()}
                >
                    <Layers fontSize="small" />
                </span>
            )}

            <Box
                className={classNames(
                    tilePopup ? classes.open : classes.closed,
                    classes.container,
                )}
                // other content sizes the popup itself
                sx={children && tilePopup ? { height: 'auto' } : undefined}
            >
                {tilePopup && (
                    <Box width={235}>
                        <Typography
                            variant="subtitle1"
                            className={classes.title}
                        >
                            {formatMessage(MESSAGES.layersTitle)}
                        </Typography>
                        <Box className={classes.iconContainer}>
                            <IconButton
                                size="small"
                                onClick={() => toggleTilePopup()}
                                icon="clear"
                                tooltipMessage={MESSAGES.close}
                            />
                        </Box>
                        {children ?? (
                            <TileSwitch
                                setCurrentTile={newtile =>
                                    setCurrentTile?.(newtile as Tile)
                                }
                                currentTile={currentTile as Tile}
                            />
                        )}
                    </Box>
                )}
            </Box>
        </Box>
    );
};
