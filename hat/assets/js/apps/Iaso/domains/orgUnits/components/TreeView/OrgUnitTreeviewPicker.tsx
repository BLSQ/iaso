import { Box, InputLabel, Paper } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    FormControl,
    IconButton,
    TruncatedTreeview,
    useSafeIntl,
} from 'bluesquare-components';
import classnames from 'classnames';
import React from 'react';
import { baseUrls } from '../../../../constants/urls';
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
    treeviews: {
        alignItems: 'center',
        fontSize: '16px',
        flex: '1',
        marginLeft: '10px',
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
    label: () => void; // This should be typed according to what label actually is
    clearable: boolean;
    errors: string[];
};

const formatPlaceholder = (
    placeholder: string | { id: string; defaultMessage: string },
    formatMessage: (message: { id: string; defaultMessage: string }) => string,
) => {
    if (!placeholder) return null;
    if (typeof placeholder === 'string') return placeholder;
    return formatMessage(placeholder);
};

const noOp = () => {};

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
        formatPlaceholder(placeholder, intl.formatMessage) ??
        (multiselect
            ? intl.formatMessage(MESSAGES.selectMultiple)
            : intl.formatMessage(MESSAGES.selectSingle));
    const makeTruncatedTrees = (treesData: any) => {
        // Type should be adjusted to actual data type
        if (treesData.size === 0)
            return (
                <div
                    role="button"
                    tabIndex={0}
                    onClick={disabled ? noOp : onClick}
                    className={placeholderStyle}
                >
                    {formattedPlaceholder}
                </div>
            );
        const treeviews = [];
        treesData.forEach((value: any, key: any) => {
            // Types should be adjusted to actual data types
            const treeview = (
                <TruncatedTreeview
                    onClick={disabled ? noOp : onClick}
                    selectedItems={value}
                    key={`TruncatedTree${key.toString()}`}
                    label={label}
                    disabled={disabled}
                    redirect={(id: string) =>
                        disabled
                            ? null
                            : window.open(
                                  `/dashboard/${baseUrls.orgUnitDetails}/orgUnitId/${id}`,
                                  '_blank',
                              )
                    }
                />
            );
            treeviews.push(treeview);
        });
        return <div className={classes.treeviews}>{treeviews}</div>;
    };
    return (
        <Box mt={2} mb={2}>
            <FormControl errors={errors}>
                <InputLabel
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
                    {makeTruncatedTrees(selectedItems)}
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
                                onClick={
                                    disabled
                                        ? noOp
                                        : () => {
                                              resetSelection();
                                          }
                                }
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
                        onClick={disabled ? noOp : onClick}
                        disabled={disabled}
                    />
                </Paper>
            </FormControl>
        </Box>
    );
};

export { OrgUnitTreeviewPicker };
