import React from 'react';
import { func, any } from 'prop-types';
import { TreeView, TreeItem } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core/styles';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';

const styles = theme => ({
    truncatedTreeview: {
        '&:hover .MuiTreeItem-label': {
            backgroundColor: 'white',
        },
        '&.MuiTreeItem-root:focus > .MuiTreeItem-content .MuiTreeItem-label': {
            backgroundColor: 'white',
        },
        '&MuiTreeItem-iconContainer': {
            width: '0px',
        },
        '& .MuiTreeItem-label': {
            paddingLeft: '0px',
        },
        color: theme.palette.mediumGray.main,
    },
    lastTreeItem: {
        '&:hover .MuiTreeItem-label': {
            backgroundColor: 'white',
        },
        '&.MuiTreeItem-root:focus > .MuiTreeItem-content .MuiTreeItem-label': {
            backgroundColor: 'white',
        },
        color: theme.palette.gray.main,
    },
    singleTreeItem: {
        '& .MuiTreeItem-iconContainer': {
            width: '0px',
        },
        '& .MuiTreeItem-label': {
            paddingLeft: '0px',
        },
        color: theme.palette.gray.main,
    },
});
const determineClassName = (items, nextItems, style) => {
    if (items.size === 1) return style.singleTreeItem;
    if (nextItems.size === 0) return style.lastTreeItem;
    return style.truncatedTreeView;
};
const useStyles = makeStyles(styles);

const TruncatedTreeview = ({ onClick, selectedItems }) => {
    const style = useStyles();
    const makeTreeItems = (items, initialItems) => {
        if (items.size === 0) return null;
        const nextItems = new Map(items);
        // first entry of the map in the form of an array: [key,value]
        const item = nextItems.entries().next().value;
        nextItems.delete(item[0]);
        const className = determineClassName(initialItems, nextItems, style);
        return (
            <TreeItem
                key={item + nextItems.size.toString()}
                className={className}
                onIconClick={e => e.preventDefault()}
                onLabelClick={e => e.preventDefault()}
                collapseIcon={
                    <ArrowDropDownIcon style={{ fontSize: 'large' }} />
                }
                expandIcon={<ArrowRightIcon style={{ fontSize: 'large' }} />}
                label={item[1]}
                nodeId={item[0].toString()}
            >
                {items.size >= 1
                    ? makeTreeItems(nextItems, initialItems)
                    : null}
            </TreeItem>
        );
    };
    const expanded =
        Array.from(selectedItems.keys()).map(item => item.toString()) ?? [];
    return (
        <TreeView
            onClick={onClick}
            disableSelection
            expanded={expanded}
            className={style.truncatedTreeview}
        >
            {makeTreeItems(selectedItems, selectedItems)}
        </TreeView>
    );
};

TruncatedTreeview.propTypes = {
    onClick: func.isRequired,
    // in fact a nested map : {orgUnitId:{parentId:parentName}}
    selectedItems: any,
};
TruncatedTreeview.defaultProps = {
    selectedItems: null,
};

export { TruncatedTreeview };
