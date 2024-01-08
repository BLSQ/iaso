import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Box } from '@mui/material';
import { makeStyles } from '@mui/styles';

import Edit from '@mui/icons-material/Settings';
import DeleteIcon from '@mui/icons-material/Delete';

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

const ShapesButtons = ({
    disabled,
    editEnabled,
    deleteEnabled,
    addEnabled,
    toggleEditShape,
    toggleAddShape,
    toggleDeleteShape,
    addShape,
    hasShape,
    shapeKey,
    color,
}) => {
    const classes = useStyles();
    return (
        <>
            <Box mb={2}>
                <Button
                    disabled={disabled || deleteEnabled || editEnabled}
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
                        {...(addEnabled ? MESSAGES.done : MESSAGES.add)}
                    />
                </Button>
            </Box>
            {hasShape && (
                <>
                    <Box mb={2}>
                        <Button
                            disabled={disabled || deleteEnabled || addEnabled}
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
                            disabled={disabled || editEnabled || addEnabled}
                            variant="outlined"
                            color={color}
                            className={classes.button}
                            onClick={() => toggleDeleteShape(shapeKey)}
                        >
                            <DeleteIcon className={classes.buttonIcon} />
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
    );
};

ShapesButtons.defaultProps = {
    editDisabledMessage: '',
    color: 'primary',
};

ShapesButtons.propTypes = {
    disabled: PropTypes.bool.isRequired,
    editEnabled: PropTypes.bool.isRequired,
    addEnabled: PropTypes.bool.isRequired,
    deleteEnabled: PropTypes.bool.isRequired,
    toggleEditShape: PropTypes.func.isRequired,
    toggleDeleteShape: PropTypes.func.isRequired,
    toggleAddShape: PropTypes.func.isRequired,
    addShape: PropTypes.func.isRequired,
    hasShape: PropTypes.bool.isRequired,
    shapeKey: PropTypes.string.isRequired,
    editDisabledMessage: PropTypes.string,
    color: PropTypes.string,
};

export default ShapesButtons;
