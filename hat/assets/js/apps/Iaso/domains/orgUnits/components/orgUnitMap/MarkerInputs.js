import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Box, makeStyles } from '@material-ui/core';

import AddLocation from '@material-ui/icons/AddLocation';
import DeleteIcon from '@material-ui/icons/Delete';

import PropTypes from 'prop-types';

import { commonStyles } from 'bluesquare-components';

import InputComponent from '../../../../components/forms/InputComponent';

import MESSAGES from '../../messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    button: {
        width: '100%',
    },
}));
const MarkerInputs = ({ orgUnit, onChangeLocation, addMarker, hasMarker }) => {
    const classes = useStyles();
    return (
        <>
            <Box>
                {!orgUnit.geo_json && !hasMarker && (
                    <Box mb={2} mt={2}>
                        <Button
                            variant="outlined"
                            onClick={() => addMarker()}
                            className={classes.button}
                            color="primary"
                        >
                            <AddLocation className={classes.buttonIcon} />
                            <FormattedMessage {...MESSAGES.addLocation} />
                        </Button>
                    </Box>
                )}
                {hasMarker && (
                    <>
                        <InputComponent
                            keyValue="latitude"
                            onChange={(key, latitude) => {
                                if (latitude) {
                                    onChangeLocation({
                                        lat: parseFloat(latitude),
                                    });
                                }
                            }}
                            value={orgUnit.latitude}
                            type="number"
                            label={MESSAGES.latitude}
                        />
                        <InputComponent
                            keyValue="longitude"
                            onChange={(key, longitude) => {
                                if (longitude) {
                                    onChangeLocation({
                                        lng: parseFloat(longitude),
                                    });
                                }
                            }}
                            value={orgUnit.longitude}
                            type="number"
                            label={MESSAGES.longitude}
                        />
                        <InputComponent
                            keyValue="altitude"
                            value={orgUnit.altitude}
                            type="number"
                            label={MESSAGES.altitude}
                            onChange={(key, altitude) => {
                                onChangeLocation({
                                    alt: altitude ? parseFloat(altitude) : null,
                                });
                            }}
                        />
                        <Box mb={2} mt={2}>
                            <Button
                                variant="outlined"
                                color="primary"
                                className={classes.button}
                                onClick={() =>
                                    onChangeLocation({
                                        lat: null,
                                        lng: null,
                                        alt: null,
                                    })
                                }
                            >
                                <DeleteIcon className={classes.buttonIcon} />
                                <FormattedMessage {...MESSAGES.deleteMarker} />
                            </Button>
                        </Box>
                    </>
                )}
            </Box>
        </>
    );
};
MarkerInputs.propTypes = {
    orgUnit: PropTypes.object.isRequired,
    addMarker: PropTypes.func.isRequired,
    onChangeLocation: PropTypes.func.isRequired,
    hasMarker: PropTypes.bool.isRequired,
};

export default MarkerInputs;
