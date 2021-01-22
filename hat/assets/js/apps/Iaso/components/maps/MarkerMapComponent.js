import React, { Component } from 'react';
import { Map, TileLayer } from 'react-leaflet';
import Control from 'react-leaflet-control';
import { injectIntl, FormattedMessage } from 'react-intl';
import L from 'leaflet';

import { withStyles, Dialog, DialogActions, Button } from '@material-ui/core';
import Layers from '@material-ui/icons/Layers';

import PropTypes from 'prop-types';

import { customZoomBar } from '../../utils/mapUtils';

import tiles from '../../constants/mapTiles';
import MarkerComponent from './markers/MarkerComponent';
import TileSwitch from './tools/TileSwitchComponent';

import commonStyles from '../../styles/common';

import MESSAGES from './messages';

const boundsOptions = { padding: [500, 500] };

const styles = theme => ({
    mapContainer: {
        ...commonStyles(theme).mapContainer,
        height: 400,
        minWidth: 200,
        marginBottom: 0,
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
});

class MarkerMap extends Component {
    constructor(props) {
        super(props);
        this.state = {
            displayTilePopup: false,
            currentTile: tiles.osm,
        };
    }

    componentDidMount() {
        const {
            intl: { formatMessage },
        } = this.props;
        const zoomBar = customZoomBar(formatMessage, () => this.fitToBounds());
        zoomBar.addTo(this.map.leafletElement);
        this.fitToBounds();
    }

    fitToBounds() {
        const { latitude, longitude } = this.props;
        const latlng = [L.latLng(latitude, longitude)];
        const markerBounds = L.latLngBounds(latlng);
        this.map.leafletElement.fitBounds(markerBounds, {
            maxZoom: 9,
            padding: boundsOptions.padding,
        });
    }

    toggleTilePopup() {
        this.setState({
            displayTilePopup: !this.state.displayTilePopup,
        });
    }

    handleChangeTile(currentTile) {
        this.setState({
            currentTile,
        });
    }

    render() {
        const { classes, latitude, longitude } = this.props;
        const { currentTile, displayTilePopup } = this.state;
        if (!latitude || !longitude) return null;
        return (
            <div className={classes.mapContainer}>
                <Dialog
                    open={displayTilePopup}
                    onClick={() => this.toggleTilePopup()}
                >
                    <div className={classes.tileSwitchContainer}>
                        <TileSwitch
                            setCurrentTile={newtile =>
                                this.handleChangeTile(newtile)
                            }
                            currentTile={currentTile}
                        />
                    </div>
                    <DialogActions>
                        <Button
                            onClick={() => this.toggleTilePopup()}
                            color="primary"
                        >
                            <FormattedMessage {...MESSAGES.close} />
                        </Button>
                    </DialogActions>
                </Dialog>
                <Map
                    scrollWheelZoom={false}
                    maxZoom={currentTile.maxZoom}
                    style={{ height: '100%' }}
                    center={[0, 0]}
                    ref={ref => {
                        this.map = ref;
                    }}
                    zoomControl={false}
                    keyboard={false}
                    zoomSnap={0.1}
                >
                    <TileLayer
                        attribution={
                            currentTile.attribution
                                ? currentTile.attribution
                                : ''
                        }
                        url={currentTile.url}
                    />
                    <MarkerComponent
                        item={{
                            latitude,
                            longitude,
                        }}
                    />
                    <Control position="topright">
                        <div className="leaflet-bar">
                            <span
                                className={classes.barButton}
                                role="button"
                                tabIndex="0"
                                onClick={() => this.toggleTilePopup()}
                            >
                                <Layers fontSize="small" />
                            </span>
                        </div>
                    </Control>
                </Map>
            </div>
        );
    }
}

MarkerMap.propTypes = {
    classes: PropTypes.object.isRequired,
    latitude: PropTypes.any.isRequired,
    longitude: PropTypes.any.isRequired,
    intl: PropTypes.object.isRequired,
};

export default withStyles(styles)(injectIntl(MarkerMap));
