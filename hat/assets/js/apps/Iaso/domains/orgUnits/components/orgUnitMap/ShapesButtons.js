import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Box, makeStyles } from '@material-ui/core';

import Edit from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';

import PropTypes from 'prop-types';

import { commonStyles } from 'bluesquare-components';

import ShapeSvg from '../../../../components/svg/ShapeSvgComponent';

import MESSAGES from '../../messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    button: {
        width: '100%',
    },
}));

const EditOrgUnitOptionComponent = ({
    disabled,
    editEnabled,
    deleteEnabled,
    hasEditRight,
    addEnabled,
    toggleEditShape,
    toggleAddShape,
    toggleDeleteShape,
    addShape,
    canAdd,
    hasShape,
    shapeKey,
    editDisabledMessage,
    color,
}) => {
    const classes = useStyles();
    return (
        <>
            {!hasEditRight && hasShape && (
                <Box mb={2}>{editDisabledMessage}</Box>
            )}
            {hasEditRight && (
                <>
                    {canAdd && (
                        <Box mb={2}>
                            <Button
                                disabled={
                                    disabled || deleteEnabled || editEnabled
                                }
                                variant="outlined"
                                className={classes.button}
                                onClick={() =>
                                    addEnabled
                                        ? toggleAddShape(shapeKey)
                                        : addShape(shapeKey)
                                }
                                color={color}
                            >
                                <ShapeSvg className={classes.buttonIcon} />
                                <FormattedMessage
                                    {...(addEnabled
                                        ? MESSAGES.done
                                        : MESSAGES.add)}
                                />
                            </Button>
                        </Box>
                    )}
                    {hasShape && (
                        <>
                            <Box mb={2}>
                                <Button
                                    disabled={
                                        disabled || deleteEnabled || addEnabled
                                    }
                                    variant="outlined"
                                    color={color}
                                    className={classes.button}
                                    onClick={() => toggleEditShape(shapeKey)}
                                >
                                    <Edit className={classes.buttonIcon} />
                                    <FormattedMessage
                                        {...(editEnabled
                                            ? MESSAGES.done
                                            : MESSAGES.edit)}
                                    />
                                </Button>
                            </Box>
                            <Box mb={2}>
                                <Button
                                    disabled={
                                        disabled || editEnabled || addEnabled
                                    }
                                    variant="outlined"
                                    color={color}
                                    className={classes.button}
                                    onClick={() => toggleDeleteShape(shapeKey)}
                                >
                                    <DeleteIcon
                                        className={classes.buttonIcon}
                                    />
                                    <FormattedMessage
                                        {...(deleteEnabled
                                            ? MESSAGES.done
                                            : MESSAGES.delete)}
                                    />
                                </Button>
                            </Box>
                        </>
                    )}
                </>
            )}
        </>
    );
};

EditOrgUnitOptionComponent.defaultProps = {
    editDisabledMessage: '',
    color: 'primary',
};

EditOrgUnitOptionComponent.propTypes = {
    disabled: PropTypes.bool.isRequired,
    editEnabled: PropTypes.bool.isRequired,
    addEnabled: PropTypes.bool.isRequired,
    deleteEnabled: PropTypes.bool.isRequired,
    toggleEditShape: PropTypes.func.isRequired,
    toggleDeleteShape: PropTypes.func.isRequired,
    toggleAddShape: PropTypes.func.isRequired,
    addShape: PropTypes.func.isRequired,
    canAdd: PropTypes.bool.isRequired,
    hasShape: PropTypes.bool.isRequired,
    hasEditRight: PropTypes.bool.isRequired,
    shapeKey: PropTypes.string.isRequired,
    editDisabledMessage: PropTypes.string,
    color: PropTypes.string,
};

export default EditOrgUnitOptionComponent;
