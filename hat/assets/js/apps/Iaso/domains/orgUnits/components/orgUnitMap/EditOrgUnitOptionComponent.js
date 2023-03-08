import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Box, Typography, makeStyles } from '@material-ui/core';

import PropTypes from 'prop-types';

import { commonStyles } from 'bluesquare-components';

import MarkerInputs from './MarkerInputs';
import ShapesButtons from './ShapesButtons';

import MESSAGES from '../../messages';
import { innerDrawerStyles } from '../../../../components/nav/InnerDrawer/styles';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    ...innerDrawerStyles(theme),
    button: {
        width: '100%',
    },
}));

const EditOrgUnitOptionComponent = ({
    orgUnit,
    locationState,
    catchmentState,
    toggleEditShape,
    toggleAddShape,
    toggleDeleteShape,
    onChangeLocation,
    toggleAddMarker,
    addShape,
    canEditLocation,
    canEditCatchment,
    isCreatingMarker,
}) => {
    const classes = useStyles();
    const hasMarker =
        Boolean(orgUnit.latitude !== null) &&
        Boolean(orgUnit.longitude !== null);
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
                    <MarkerInputs
                        orgUnit={orgUnit}
                        onChangeLocation={onChangeLocation}
                        toggleAddMarker={toggleAddMarker}
                        hasMarker={hasMarker}
                        actionBusy={
                            locationState.edit ||
                            locationState.add ||
                            locationState.delete ||
                            catchmentState.edit ||
                            catchmentState.add ||
                            catchmentState.delete
                        }
                        isCreatingMarker={isCreatingMarker}
                    />
                    {!hasMarker && (
                        <>
                            {!canEditLocation && orgUnit.geo_json && (
                                <Box mb={2}>
                                    <FormattedMessage
                                        {...MESSAGES.editLocationDisabled}
                                    />
                                </Box>
                            )}
                            {canEditLocation && (
                                <ShapesButtons
                                    disabled={
                                        catchmentState.edit ||
                                        catchmentState.delete ||
                                        catchmentState.add ||
                                        isCreatingMarker
                                    }
                                    editEnabled={locationState.edit}
                                    deleteEnabled={locationState.delete}
                                    addEnabled={locationState.add}
                                    toggleEditShape={toggleEditShape}
                                    toggleDeleteShape={toggleDeleteShape}
                                    toggleAddShape={toggleAddShape}
                                    addShape={addShape}
                                    hasShape={Boolean(orgUnit.geo_json)}
                                    shapeKey="location"
                                />
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
                        <ShapesButtons
                            disabled={
                                locationState.edit ||
                                locationState.delete ||
                                locationState.add ||
                                isCreatingMarker
                            }
                            editEnabled={catchmentState.edit}
                            deleteEnabled={catchmentState.delete}
                            addEnabled={catchmentState.add}
                            toggleEditShape={toggleEditShape}
                            toggleAddShape={toggleAddShape}
                            toggleDeleteShape={toggleDeleteShape}
                            addShape={addShape}
                            color="secondary"
                            hasShape={Boolean(orgUnit.catchment)}
                            shapeKey="catchment"
                        />
                    )}
                </Box>
            </Box>
        </Box>
    );
};
EditOrgUnitOptionComponent.propTypes = {
    orgUnit: PropTypes.object.isRequired,
    locationState: PropTypes.object.isRequired,
    catchmentState: PropTypes.object.isRequired,
    toggleEditShape: PropTypes.func.isRequired,
    toggleAddShape: PropTypes.func.isRequired,
    toggleDeleteShape: PropTypes.func.isRequired,
    toggleAddMarker: PropTypes.func.isRequired,
    addShape: PropTypes.func.isRequired,
    onChangeLocation: PropTypes.func.isRequired,
    canEditLocation: PropTypes.bool.isRequired,
    canEditCatchment: PropTypes.bool.isRequired,
    isCreatingMarker: PropTypes.bool.isRequired,
};

export default EditOrgUnitOptionComponent;
