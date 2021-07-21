import React from 'react';
import { func, any } from 'prop-types';
import { TreeView, TreeItem } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core/styles';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
// import { MESSAGES } from './messages';

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

const TruncatedTreeview = ({ onClick, selectedItems }) => {
    const style = useStyles();
    const makeTreeItems = items => {
        if (items.size === 0) return null;
        const nextItems = new Map(items);
        // first entry of the map in the form of an array: [key,value]
        const item = nextItems.entries().next().value;
        nextItems.delete(item[0]);
        return (
            <TreeItem
                key={item + nextItems.size.toString()}
                className={style.truncatedTreeview}
                onIconClick={e => e.preventDefault()}
                onLabelClick={e => e.preventDefault()}
                collapseIcon={<ExpandMoreIcon />}
                expandIcon={<ChevronRightIcon />}
                label={item[1]}
                nodeId={item[0].toString()}
            >
                {items.size >= 1 ? makeTreeItems(nextItems) : null}
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
            {makeTreeItems(selectedItems)}
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
