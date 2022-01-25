import { func, any, bool, object, oneOfType, string } from 'prop-types';
import React from 'react';
import { Paper, InputLabel, Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { FormControl, IconButton, useSafeIntl } from 'bluesquare-components';
import { MESSAGES } from './messages';
import { TruncatedTreeview } from './TruncatedTreeview';

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
        border: '1px solid rgba(0,0,0,0.23)', // aligning with AutoSelect
        paddingTop: 12,
        paddingBottom: 12,
        paddingRight: theme.spacing(2),
    },
    inputLabel: {
        backgroundColor: 'white',
        color: theme.palette.mediumGray.main,
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
});
const formatPlaceholder = (placeholder, formatMessage) => {
    if (!placeholder) return null;
    if (typeof placeholder === 'string') return placeholder;
    return formatMessage(placeholder);
};

const useStyles = makeStyles(styles);
const OrgUnitTreeviewPicker = ({
    onClick,
    selectedItems,
    resetSelection,
    multiselect,
    placeholder,
    required,
    disabled,
    label,
    clearable,
}) => {
    const intl = useSafeIntl();
    const classes = useStyles();
    const className = disabled
        ? classes.paper
        : `${classes.paper} ${classes.enabled}`;

    const placeholderStyle = disabled
        ? classes.placeholder
        : `${classes.placeholder} ${classes.pointer}`;
    const formattedPlaceholder =
        formatPlaceholder(placeholder, intl.formatMessage) ??
        (multiselect
            ? intl.formatMessage(MESSAGES.selectMultiple)
            : intl.formatMessage(MESSAGES.selectSingle));
    const noOp = () => null;

    const makeTruncatedTrees = treesData => {
        if (treesData.size === 0)
            return (
                <div
                    role="button"
                    tabIndex="0"
                    onClick={disabled ? noOp : onClick}
                    className={placeholderStyle}
                >
                    {formattedPlaceholder}
                </div>
            );
        const treeviews = [];
        treesData.forEach((value, key) => {
            // console.log(value, key);
            const treeview = (
                <TruncatedTreeview
                    onClick={disabled ? noOp : onClick}
                    selectedItems={value}
                    key={`TruncatedTree${key.toString()}`}
                    label={label}
                />
            );
            treeviews.push(treeview);
        });
        return <div className={classes.treeviews}>{treeviews}</div>;
    };
    return (
        <FormControl withMarginTop>
            <InputLabel
                shrink={selectedItems.size > 0}
                required={required}
                className={classes.inputLabel}
            >
                {formattedPlaceholder}
            </InputLabel>
            <Paper variant="outlined" elevation={0} className={className}>
                {makeTruncatedTrees(selectedItems)}
                {clearable && resetSelection && selectedItems.size > 0 && (
                    <Box className={classes.clearButton}>
                        <IconButton
                            icon="clear"
                            size="small"
                            tooltipMessage={MESSAGES.clear}
                            onClick={resetSelection}
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
                    onClick={onClick}
                />
            </Paper>
        </FormControl>
    );
};

OrgUnitTreeviewPicker.propTypes = {
    onClick: func.isRequired,
    // map with other maps as values: {id:{id:name}}
    selectedItems: any,
    resetSelection: func,
    multiselect: bool,
    placeholder: oneOfType([object, string]),
    required: bool,
    disabled: bool,
    label: func.isRequired,
    clearable: bool,
};
OrgUnitTreeviewPicker.defaultProps = {
    selectedItems: [],
    resetSelection: null,
    multiselect: false,
    placeholder: null,
    required: false,
    disabled: false,
    clearable: true,
};

export { OrgUnitTreeviewPicker };
