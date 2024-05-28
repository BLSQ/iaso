import { Box, InputLabel, Paper } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { FormControl, IconButton, useSafeIntl } from 'bluesquare-components';
import classnames from 'classnames';
import React, { ReactNode, useCallback } from 'react';
import { OrgUnit } from '../../types/orgUnit';
import { TruncatedTrees } from './TruncatedTrees';
import { MESSAGES } from './messages';

const styles = theme => ({
    placeholder: {
        alignItems: 'center',
        fontSize: '16px',
        flex: '1',
        marginLeft: '14px',
        cursor: 'default',
        color: 'transparent',
    },
    paper: {
        display: 'flex',
        alignItems: 'center',
        border: '1px solid rgba(0,0,0,0.23) !important', // aligning with AutoSelect
        paddingTop: 10,
        paddingBottom: 10,
        paddingRight: theme.spacing(2),
    },
    inputLabel: {
        backgroundColor: 'white',
        color: theme.palette.mediumGray.main,
    },
    shrinkInputLabel: {
        fontSize: '20px',
    },
    enabled: {
        '&:hover': {
            border: '1px solid rgba(0,0,0,0.87)', // aligning with AutoSelect
        },
    },
    pointer: { cursor: 'pointer' },
    clearButton: {
        marginRight: 5,
    },
    error: {
        '&:hover': { border: `1px solid ${theme.palette.error.main}` },
        border: `1px solid ${theme.palette.error.main}`,
    },
    errorLabel: {
        color: theme.palette.error.main,
    },
});

type Props = {
    onClick: () => void;
    selectedItems: any; // This should be typed according to what selectedItems actually is
    resetSelection?: () => void;
    multiselect: boolean;
    placeholder?: string | { id: string; defaultMessage: string };
    required: boolean;
    disabled: boolean;
    // eslint-disable-next-line no-unused-vars
    label: (orgUnit: OrgUnit) => ReactNode;
    clearable: boolean;
    errors: string[];
};

const formatPlaceholder = (
    // eslint-disable-next-line no-unused-vars
    formatMessage: (message: { id: string; defaultMessage: string }) => string,
    placeholder?: string | { id: string; defaultMessage: string },
) => {
    if (!placeholder) return null;
    if (typeof placeholder === 'string') return placeholder;
    return formatMessage(placeholder);
};

const useStyles = makeStyles(styles);

const OrgUnitTreeviewPicker: React.FC<Props> = ({
    onClick,
    selectedItems,
    resetSelection,
    multiselect,
    placeholder,
    required,
    disabled,
    label,
    clearable,
    errors,
}) => {
    const intl = useSafeIntl();
    const classes = useStyles();
    const hasError = errors.length > 0;

    const errorStyle = hasError && !disabled ? classes.error : '';
    const errorLabelStyle = hasError && !disabled ? classes.errorLabel : '';
    const enabledStyle = disabled ? '' : classes.enabled;

    const placeholderStyle = disabled
        ? classes.placeholder
        : `${classes.placeholder} ${classes.pointer}`;

    const formattedPlaceholder =
        formatPlaceholder(intl.formatMessage, placeholder) ??
        (multiselect
            ? intl.formatMessage(MESSAGES.selectMultiple)
            : intl.formatMessage(MESSAGES.selectSingle));

    const handleOnClick = useCallback(() => {
        if (!disabled) {
            onClick();
        }
    }, [onClick, disabled]);

    const handleResetSelection = useCallback(() => {
        if (!disabled && resetSelection) {
            resetSelection();
        }
    }, [resetSelection, disabled]);

    return (
        <Box mt={2} mb={2}>
            <FormControl errors={errors}>
                {/* @ts-ignore: Unresolved issue with ReactNodeLike types, needs further investigation */}
                <>
                    <InputLabel
                        key="input-label"
                        shrink={selectedItems.size > 0}
                        required={required}
                        className={`${classnames(
                            classes.inputLabel,
                            selectedItems.size > 0 && classes.shrinkInputLabel,
                            'input-label',
                        )} ${errorLabelStyle}`}
                    >
                        {formattedPlaceholder}
                    </InputLabel>
                    <Paper
                        variant="outlined"
                        elevation={0}
                        className={`${classes.paper} ${enabledStyle} ${errorStyle}`}
                    >
                        <TruncatedTrees
                            treesData={selectedItems}
                            disabled={disabled}
                            label={label}
                            placeholderStyle={placeholderStyle}
                            formattedPlaceholder={formattedPlaceholder}
                        />
                        {clearable && resetSelection && selectedItems.size > 0 && (
                            <Box
                                className={classnames(
                                    classes.clearButton,
                                    'clear-tree',
                                )}
                            >
                                <IconButton
                                    icon="clear"
                                    size="small"
                                    tooltipMessage={MESSAGES.clear}
                                    onClick={handleResetSelection}
                                />
                            </Box>
                        )}
                        <IconButton
                            size="small"
                            tooltipMessage={
                                multiselect
                                    ? MESSAGES.selectMultiple
                                    : MESSAGES.selectSingle
                            }
                            icon="orgUnit"
                            onClick={handleOnClick}
                            disabled={disabled}
                        />
                    </Paper>
                </>
            </FormControl>
        </Box>
    );
};

export { OrgUnitTreeviewPicker };
