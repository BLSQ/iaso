import React, { FunctionComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Box, ButtonPropsColorOverrides } from '@mui/material';
import { makeStyles } from '@mui/styles';
import Edit from '@mui/icons-material/Settings';
import DeleteIcon from '@mui/icons-material/Delete';
import { commonStyles } from 'bluesquare-components';
import ShapeSvg from '../../../../components/svg/ShapeSvgComponent';
import MESSAGES from '../../messages';
import { OverridableStringUnion } from '@mui/types';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    button: {
        width: '100%',
    },
}));

type Props = {
    disabled: boolean;
    editEnabled: boolean;
    addEnabled: boolean;
    deleteEnabled: boolean;
    toggleEditShape: (keyValue: string) => void;
    toggleAddShape: (keyValue: string) => void;
    toggleDeleteShape: (keyValue: string) => void;
    addShape: (shapeType: string) => void;
    hasShape: boolean;
    shapeKey: string;
    color?:
        | OverridableStringUnion<
              | 'inherit'
              | 'primary'
              | 'secondary'
              | 'success'
              | 'error'
              | 'info'
              | 'warning',
              ButtonPropsColorOverrides
          >
        | undefined;
};
const ShapesButtons: FunctionComponent<Props> = ({
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
    color = 'primary',
}) => {
    const classes: Record<string, string> = useStyles();
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

export default ShapesButtons;
