import React, { FunctionComponent, useState } from 'react';
import { Dialog, DialogActions, Button, makeStyles } from '@material-ui/core';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import Layers from '@material-ui/icons/Layers';

import TileSwitch from './TileSwitchComponent';

import MESSAGES from '../messages';

const useStyles = makeStyles(theme => ({
    tileSwitchContainer: {
        marginBottom: -theme.spacing(4),
    },
    legendLayers: {
        position: 'absolute',
        right: theme.spacing(1),
        top: theme.spacing(1),
        zIndex: 500,
        borderRadius: 4,
        border: '2px solid rgba(0,0,0,0.2)',
    },
    barButton: {
        display: 'flex',
        position: 'relative',
        backgroundColor: 'white',
        borderRadius: '4px',
        padding: '2px',
        cursor: 'pointer',
        outline: 'none',
        boxShadow: 'none',
        // @ts-ignore
        color: `${theme.textColor}! important`,
    },
}));
export type Tile = {
    maxZoom: number;
    url: string;
    attribution?: string;
};
type Props = {
    currentTile: Tile;
    // eslint-disable-next-line no-unused-vars
    setCurrentTile: (newTile: Tile) => void;
};

export const TilesSwitchDialog: FunctionComponent<Props> = ({
    currentTile,
    setCurrentTile,
}) => {
    const { formatMessage } = useSafeIntl();
    const [tilePopup, setTilePopup] = useState<boolean>(false);

    const classes: Record<string, string> = useStyles();

    const toggleTilePopup = () => {
        setTilePopup(!tilePopup);
    };

    return (
        <>
            <Dialog
                open={tilePopup}
                onClose={(_, reason) => {
                    if (reason === 'backdropClick') {
                        toggleTilePopup();
                    }
                }}
            >
                <div className={classes.tileSwitchContainer}>
                    <TileSwitch
                        setCurrentTile={newtile => setCurrentTile(newtile)}
                        currentTile={currentTile}
                    />
                </div>
                <DialogActions>
                    <Button onClick={() => toggleTilePopup()} color="primary">
                        {formatMessage(MESSAGES.close)}
                    </Button>
                </DialogActions>
            </Dialog>
            <div className={classes.legendLayers}>
                <span
                    className={classes.barButton}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleTilePopup()}
                >
                    <Layers fontSize="small" />
                </span>
            </div>
        </>
    );
};
