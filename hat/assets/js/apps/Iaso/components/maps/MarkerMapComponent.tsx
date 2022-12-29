/* eslint-disable react/jsx-props-no-spreading */
import React, { FunctionComponent, useState, useEffect, useRef } from 'react';
import { Map, ScaleControl, TileLayer } from 'react-leaflet';
import { FormattedMessage } from 'react-intl';
import L from 'leaflet';

import { Dialog, DialogActions, Button, makeStyles } from '@material-ui/core';
// @ts-ignore
import { commonStyles } from 'bluesquare-components';
import Layers from '@material-ui/icons/Layers';

import { ZoomControl } from '../../utils/mapUtils';

import tiles from '../../constants/mapTiles';
import MarkerComponent from './markers/MarkerComponent';
import TileSwitch from './tools/TileSwitchComponent';

import MESSAGES from './messages';

const useStyles = makeStyles(theme => ({
    mapContainer: {
        ...commonStyles(theme).mapContainer,
        height: 400,
        minWidth: 200,
        marginBottom: 0,
        position: 'relative',
    },
    legendLayers: {
        position: 'absolute',
        right: theme.spacing(1),
        top: theme.spacing(1),
        zIndex: 400,
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
    },
    tileSwitchContainer: {
        marginBottom: -theme.spacing(4),
    },
}));

type Props = {
    latitude: number;
    longitude: number;
};

export const MarkerMap: FunctionComponent<Props> = ({
    latitude,
    longitude,
}) => {
    const [currentTile, setCurrentTitle] = useState<Record<string, any>>(
        tiles.osm,
    );
    const [tilePopup, setTilePopup] = useState<boolean>(false);

    const map: any = useRef();

    const classes: Record<string, string> = useStyles();

    const boundsOptions = { padding: [500, 500] };

    const handleChangeTile = tile => {
        setCurrentTitle(tile);
    };

    const toggleTilePopup = () => {
        setTilePopup(!tilePopup);
    };

    const fitToBounds = () => {
        const latlng = [L.latLng(latitude, longitude)];
        const markerBounds = L.latLngBounds(latlng);

        map.current.leafletElement?.fitBounds(markerBounds, {
            maxZoom: 9,
            padding: boundsOptions.padding,
        });
    };

    useEffect(() => {
        fitToBounds();
    }, []);

    if (!latitude || !longitude) return null;

    return (
        <div className={classes.mapContainer}>
            <Dialog
                open={tilePopup}
                onClose={(event, reason) => {
                    if (reason === 'backdropClick') {
                        toggleTilePopup();
                    }
                }}
            >
                <div className={classes.tileSwitchContainer}>
                    <TileSwitch
                        setCurrentTile={newtile => handleChangeTile(newtile)}
                        currentTile={currentTile}
                    />
                </div>
                <DialogActions>
                    <Button onClick={() => toggleTilePopup()} color="primary">
                        <FormattedMessage {...MESSAGES.close} />
                    </Button>
                </DialogActions>
            </Dialog>
            <Map
                scrollWheelZoom={false}
                maxZoom={currentTile.maxZoom}
                style={{ height: '100%' }}
                center={[0, 0]}
                ref={map}
                zoomControl={false}
                keyboard={false}
                zoomSnap={0.1}
            >
                <ZoomControl fitToBounds={() => fitToBounds()} />

                <ScaleControl imperial={false} />
                <TileLayer
                    attribution={
                        currentTile.attribution ? currentTile.attribution : ''
                    }
                    url={currentTile.url}
                />
                <MarkerComponent
                    item={{
                        latitude,
                        longitude,
                    }}
                />
            </Map>
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
        </div>
    );
};
