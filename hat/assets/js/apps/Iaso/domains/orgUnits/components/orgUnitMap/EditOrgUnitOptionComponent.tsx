import React, { FunctionComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import { Box, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles } from 'bluesquare-components';
import MarkerInputs from './MarkerInputs';
import ShapesButtons from './ShapesButtons';
import MESSAGES from '../../messages';
import { innerDrawerStyles } from '../../../../components/nav/InnerDrawer/styles';
import { OrgUnit } from '../../types/orgUnit';

//@ts-ignore
const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    ...innerDrawerStyles(theme),
    button: {
        width: '100%',
    },
}));

type Props = {
    orgUnit: OrgUnit;
    locationState: Record<string, any>;
    catchmentState: Record<string, any>;
    toggleEditShape: (keyValue: string) => void;
    toggleAddShape: (keyValue: string) => void;
    toggleDeleteShape: (keyValue: string) => void;
    addShape: (shapeType: string) => void;
    toggleAddMarker: () => void;
    onChangeLocation: (latLong: any) => void;
    canEditLocation: boolean;
    canEditCatchment: boolean;
    isCreatingMarker: boolean;
    errorsCoordinates: {
        latitude: [];
        longitude: [];
    };
    setErrorsCoordinates: React.Dispatch<
        React.SetStateAction<{
            latitude: [];
            longitude: [];
        }>
    >;
};
const EditOrgUnitOptionComponent: FunctionComponent<Props> = ({
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
    errorsCoordinates,
    setErrorsCoordinates,
}) => {
    const classes: Record<string, string> = useStyles();
    const hasMarker = orgUnit.latitude !== null || orgUnit.longitude !== null;
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
                        errorsCoordinates={errorsCoordinates}
                        setErrorsCoordinates={setErrorsCoordinates}
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

export default EditOrgUnitOptionComponent;
