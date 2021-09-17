import { func, any, bool, object, oneOfType, string } from 'prop-types';
import React from 'react';
import { Paper } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { IconButton, useSafeIntl } from 'bluesquare-components';
import { MESSAGES } from './messages';
import { TruncatedTreeview } from './TruncatedTreeview';

const styles = theme => ({
    placeholder: {
        alignItems: 'center',
        fontSize: '16px',
        flex: '1',
        marginLeft: '14px',
        cursor: 'pointer',
        color: theme.palette.gray.main,
    },
    treeviews: {
        alignItems: 'center',
        fontSize: '16px',
        flex: '1',
        marginLeft: '10px',
        cursor: 'pointer',
    },
    paper: {
        display: 'flex',
        alignItems: 'center',
        border: '1px solid rgba(0,0,0,0.23)', // aligning with AutoSelect
        paddingTop: '3px',
        paddingBottom: '3px',
        '&:hover': {
            border: '1px solid rgba(0,0,0,0.87)', // aligning with AutoSelect
        },
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
}) => {
    const intl = useSafeIntl();
    const classes = useStyles();
    const formattedPlaceholder = formatPlaceholder(
        placeholder,
        intl.formatMessage,
    );
    const makeTruncatedTrees = treesData => {
        if (treesData.size === 0)
            return (
                <p onClick={onClick} className={classes.placeholder}>
                    {formattedPlaceholder ||
                        (multiselect
                            ? intl.formatMessage(MESSAGES.selectMultiple)
                            : intl.formatMessage(MESSAGES.selectSingle))}
                </p>
            );
        const treeviews = [];
        treesData.forEach((value, key) => {
            const treeview = (
                <TruncatedTreeview
                    onClick={onClick}
                    selectedItems={value}
                    key={`TruncatedTree${key.toString()}`}
                />
            );
            treeviews.push(treeview);
        });
        return <div className={classes.treeviews}>{treeviews}</div>;
    };

    return (
        <Paper variant="outlined" elevation={0} className={classes.paper}>
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
    );
};

OrgUnitTreeviewPicker.propTypes = {
    onClick: func.isRequired,
    // map with other maps as values: {id:{id:name}}
    selectedItems: any,
    resetSelection: func,
    multiselect: bool,
    placeholder: oneOfType([object, string]),
};
OrgUnitTreeviewPicker.defaultProps = {
    selectedItems: [],
    resetSelection: null,
    multiselect: false,
    placeholder: null,
};

export { OrgUnitTreeviewPicker };
