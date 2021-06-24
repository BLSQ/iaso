// NOTE: this component is not used at the moment. Shape edition has been disabled until
// we invest the time required to implement multi-polygon editing.

import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Box, Typography, makeStyles } from '@material-ui/core';

import Edit from '@material-ui/icons/Edit';
import AddLocation from '@material-ui/icons/AddLocation';
import DeleteIcon from '@material-ui/icons/Delete';
import Check from '@material-ui/icons/Check';

import PropTypes from 'prop-types';

import { commonStyles } from 'bluesquare-components';

import ShapeSvg from '../../../components/svg/ShapeSvgComponent';
import InputComponent from '../../../components/forms/InputComponent';

import MESSAGES from '../messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    button: {
        width: '100%',
    },
}));
const EditOrgUnitOptionComponent = ({
    orgUnit,
    editLocationEnabled,
    editCatchmentEnabled,
    deleteLocationEnabled,
    deleteCatchmentEnabled,
    toggleEditShape,
    onChangeLocation,
    addMarker,
    addShape,
    toggleDeleteShape,
    canEditLocation,
    canEditCatchment,
}) => {
    const classes = useStyles();
    const hasMarker =
        Boolean(orgUnit.latitude !== null) &&
        Boolean(orgUnit.longitude !== null);
    const actionDisabled =
        editCatchmentEnabled ||
        deleteCatchmentEnabled ||
        editLocationEnabled ||
        deleteLocationEnabled;
    return (
        <Box
            display="flex"
            flexWrap="wrap"
            className={classes.innerDrawerContent}
            flexDirection="column"
        >
            <Box
                component="div"
                display="flex"
                flexWrap="wrap"
                flexDirection="column"
            >
                <Box>
                    <Box
                        px={0}
                        component="div"
                        className={classes.marginTop}
                        mb={2}
                    >
                        <Typography variant="subtitle1" color="primary">
                            <FormattedMessage {...MESSAGES.location} />
                        </Typography>
                    </Box>

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
                                            lng: orgUnit.longitude,
                                        });
                                    }
                                }}
                                value={orgUnit.latitude}
                                type="number"
                                label={MESSAGES.latitude}
                            />
                            <InputComponent
                                keyValue="longitude"
                                onChange={(key, longitude) =>
                                    onChangeLocation({
                                        lat: orgUnit.latitude,
                                        lng: parseFloat(longitude),
                                    })
                                }
                                value={orgUnit.longitude}
                                type="number"
                                label={MESSAGES.longitude}
                            />
                            {/* read-only altitude field until edition is implemented */}
                            <InputComponent
                                disabled
                                keyValue="altitude"
                                value={
                                    orgUnit.altitude !== null
                                        ? orgUnit.altitude
                                        : 0
                                }
                                type="number"
                                label={MESSAGES.altitude}
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
                                        })
                                    }
                                >
                                    <DeleteIcon
                                        className={classes.buttonIcon}
                                    />
                                    <FormattedMessage
                                        {...MESSAGES.deleteMarker}
                                    />
                                </Button>
                            </Box>
                        </>
                    )}
                    {!canEditLocation && orgUnit.geo_json && (
                        <Box mb={2}>
                            <FormattedMessage
                                {...MESSAGES.editLocationDisabled}
                            />
                        </Box>
                    )}
                    {canEditLocation && (
                        <>
                            {!hasMarker && (
                                <Box mb={2}>
                                    <Button
                                        disabled={actionDisabled}
                                        variant="outlined"
                                        className={classes.button}
                                        onClick={() => addShape('geo_json')}
                                        color="primary"
                                    >
                                        <ShapeSvg
                                            className={classes.buttonIcon}
                                        />
                                        <FormattedMessage {...MESSAGES.add} />
                                    </Button>
                                </Box>
                            )}
                            {!editLocationEnabled && orgUnit.geo_json && (
                                <Box mb={2}>
                                    <Button
                                        className={classes.button}
                                        disabled={actionDisabled}
                                        variant="outlined"
                                        onClick={() =>
                                            toggleEditShape('location')
                                        }
                                        color="primary"
                                    >
                                        <Edit className={classes.buttonIcon} />
                                        <FormattedMessage {...MESSAGES.edit} />
                                    </Button>
                                </Box>
                            )}
                            {editLocationEnabled && orgUnit.geo_json && (
                                <Box mb={2}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => {
                                            toggleEditShape('location');
                                        }}
                                        className={classes.button}
                                        color="primary"
                                    >
                                        <Check className={classes.buttonIcon} />
                                        <FormattedMessage {...MESSAGES.done} />
                                    </Button>
                                </Box>
                            )}
                            {orgUnit.geo_json && (
                                <Box mb={2}>
                                    <Button
                                        disabled={
                                            editCatchmentEnabled ||
                                            editLocationEnabled ||
                                            deleteCatchmentEnabled
                                        }
                                        variant="outlined"
                                        color="primary"
                                        className={classes.button}
                                        onClick={() =>
                                            toggleDeleteShape('location')
                                        }
                                    >
                                        <DeleteIcon
                                            className={classes.buttonIcon}
                                        />
                                        <FormattedMessage
                                            {...(deleteLocationEnabled
                                                ? MESSAGES.done
                                                : MESSAGES.delete)}
                                        />
                                    </Button>
                                </Box>
                            )}
                        </>
                    )}
                </Box>
                <Box>
                    <Box px={0} component="div" mb={2}>
                        <Typography variant="subtitle1" color="secondary">
                            <FormattedMessage {...MESSAGES.catchment} />
                        </Typography>
                    </Box>
                    {!canEditCatchment && (
                        <Box mb={2}>
                            <FormattedMessage
                                {...MESSAGES.editCatchmentDisabled}
                            />
                        </Box>
                    )}
                    {canEditCatchment && (
                        <>
                            {!editCatchmentEnabled && orgUnit.catchment && (
                                <Box mb={2}>
                                    <Button
                                        className={classes.button}
                                        disabled={actionDisabled}
                                        variant="outlined"
                                        onClick={() =>
                                            toggleEditShape('catchment')
                                        }
                                        color="secondary"
                                    >
                                        <Edit className={classes.buttonIcon} />
                                        <FormattedMessage {...MESSAGES.edit} />
                                    </Button>
                                </Box>
                            )}
                            {editCatchmentEnabled && orgUnit.catchment && (
                                <Box mb={2}>
                                    <Button
                                        variant="outlined"
                                        className={classes.button}
                                        onClick={() => {
                                            toggleEditShape('catchment');
                                        }}
                                        color="secondary"
                                    >
                                        <Check className={classes.buttonIcon} />
                                        <FormattedMessage {...MESSAGES.done} />
                                    </Button>
                                </Box>
                            )}
                            <Box mb={2}>
                                <Button
                                    className={classes.button}
                                    disabled={actionDisabled}
                                    variant="outlined"
                                    onClick={() => addShape('catchment')}
                                    color="secondary"
                                >
                                    <ShapeSvg className={classes.buttonIcon} />
                                    <FormattedMessage {...MESSAGES.add} />
                                </Button>
                            </Box>
                            {orgUnit.catchment && (
                                <Box mb={2}>
                                    <Button
                                        className={classes.button}
                                        disabled={
                                            editCatchmentEnabled ||
                                            editLocationEnabled ||
                                            deleteLocationEnabled
                                        }
                                        variant="outlined"
                                        color="secondary"
                                        onClick={() =>
                                            toggleDeleteShape('catchment')
                                        }
                                    >
                                        <DeleteIcon
                                            className={classes.buttonIcon}
                                        />
                                        <FormattedMessage
                                            {...(deleteCatchmentEnabled
                                                ? MESSAGES.stopDelete
                                                : MESSAGES.delete)}
                                        />
                                    </Button>
                                </Box>
                            )}
                        </>
                    )}
                </Box>
            </Box>
        </Box>
    );
};
EditOrgUnitOptionComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    orgUnit: PropTypes.object.isRequired,
    editLocationEnabled: PropTypes.bool.isRequired,
    editCatchmentEnabled: PropTypes.bool.isRequired,
    deleteLocationEnabled: PropTypes.bool.isRequired,
    deleteCatchmentEnabled: PropTypes.bool.isRequired,
    toggleEditShape: PropTypes.func.isRequired,
    toggleDeleteShape: PropTypes.func.isRequired,
    addMarker: PropTypes.func.isRequired,
    addShape: PropTypes.func.isRequired,
    onChangeLocation: PropTypes.func.isRequired,
    canEditLocation: PropTypes.bool.isRequired,
    canEditCatchment: PropTypes.bool.isRequired,
};

export default EditOrgUnitOptionComponent;
