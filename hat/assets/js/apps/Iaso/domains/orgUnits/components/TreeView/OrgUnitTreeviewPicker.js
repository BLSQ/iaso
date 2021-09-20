import { func, any, bool, object, oneOfType, string } from 'prop-types';
import React from 'react';
import { Paper, InputLabel } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
    FormControl,
    IconButton,
    // InputLabel,
    useSafeIntl,
} from 'bluesquare-components';
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
        // cursor: 'pointer',
    },
    paper: {
        display: 'flex',
        alignItems: 'center',
        border: '1px solid rgba(0,0,0,0.23)', // aligning with AutoSelect
        paddingTop: '3px',
        paddingBottom: '3px',
        // '&:hover': {
        //     border: '1px solid rgba(0,0,0,0.87)', // aligning with AutoSelect
        // },
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
        formatPlaceholder(placeholder, intl.formatMessage) ?? multiselect
            ? intl.formatMessage(MESSAGES.selectMultiple)
            : intl.formatMessage(MESSAGES.selectSingle);
    const noOp = () => null;

    const makeTruncatedTrees = treesData => {
        if (treesData.size === 0)
            return (
                <p
                    onClick={disabled ? noOp : onClick}
                    className={placeholderStyle}
                >
                    {formattedPlaceholder}
                </p>
            );
        const treeviews = [];
        treesData.forEach((value, key) => {
            const treeview = (
                <TruncatedTreeview
                    onClick={disabled ? noOp : onClick}
                    selectedItems={value}
                    key={`TruncatedTree${key.toString()}`}
                />
            );
            treeviews.push(treeview);
        });
        return <div className={classes.treeviews}>{treeviews}</div>;
    };
    return (
        <FormControl withMarginTop={false}>
            <InputLabel
                shrink={selectedItems.size > 0}
                required={required}
                className={classes.inputLabel}
            >
                {formattedPlaceholder}
            </InputLabel>
            <Paper variant="outlined" elevation={0} className={className}>
                {makeTruncatedTrees(selectedItems)}
                {resetSelection && (
                    <IconButton
                        icon="clear"
                        tooltipMessage={MESSAGES.clear}
                        onClick={resetSelection}
                        style={{ marginRight: '16px' }}
                    />
                )}
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
};
OrgUnitTreeviewPicker.defaultProps = {
    selectedItems: [],
    resetSelection: null,
    multiselect: false,
    placeholder: null,
    required: false,
    disabled: false,
};

export { OrgUnitTreeviewPicker };
