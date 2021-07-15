import { arrayOf, func, string } from 'prop-types';
import React from 'react';
import { Paper } from '@material-ui/core';
import { TreeView, TreeItem } from '@material-ui/lab';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import { makeStyles } from '@material-ui/core/styles';
import { IconButton } from 'bluesquare-components';
import { MESSAGES } from './messages';

const styles = {
    truncatedTreeview: {
        '&:hover .MuiTreeItem-label': {
            backgroundColor: 'white',
        },
        '&.MuiTreeItem-root:focus > .MuiTreeItem-content .MuiTreeItem-label': {
            backgroundColor: 'white',
        },
        // TODO use theme for font color
    },
};

const useStyles = makeStyles(styles);

const OrgUnitTreeviewPicker = ({ onClick, selectedItems, resetSelection }) => {
    const uniqueItems = selectedItems?.map((item, index) => `${item}-${index}`);
    const style = useStyles();
    const makeTreeItems = items => {
        if (!items) return <p>Select org unit</p>;
        if (items.length === 0) return null;
        const nextItems = [...items];
        const item = nextItems.shift();
        const truncatedTree = (
            <TreeItem
                key={item + nextItems.length.toString()}
                className={style.truncatedTreeview}
                onIconClick={e => e.preventDefault()}
                onLabelClick={e => e.preventDefault()}
                collapseIcon={<ExpandMoreIcon />}
                expandIcon={<ChevronRightIcon />}
                label={item.split('-')[0]}
                nodeId={item}
            >
                {items.length >= 1 ? makeTreeItems(nextItems) : null}
            </TreeItem>
        );
        return truncatedTree;
    };
    return (
        <Paper variant="outlined" elevation={0}>
            <TreeView
                onClick={onClick}
                disableSelection
                expanded={uniqueItems ?? []}
                className={style.truncatedTreeview}
            >
                {makeTreeItems(uniqueItems)}
            </TreeView>
            {resetSelection && (
                <IconButton
                    icon="delete"
                    tooltipMessage={MESSAGES.confirm}
                    onClick={resetSelection}
                />
            )}
        </Paper>
    );
};

OrgUnitTreeviewPicker.propTypes = {
    onClick: func.isRequired,
    selectedItems: arrayOf(string),
    resetSelection: func,
};
OrgUnitTreeviewPicker.defaultProps = {
    selectedItems: null,
    resetSelection: null,
};

export { OrgUnitTreeviewPicker };

// renderTrigger = {({ openDialog }) => (
//     <IconButtonComponent
//         onClick={openDialog}
//         icon="globe"
//         tooltipMessage={MESSAGES.search}
//     />
// )}
