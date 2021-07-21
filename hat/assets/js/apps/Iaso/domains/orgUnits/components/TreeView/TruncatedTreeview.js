import React from 'react';
import { arrayOf, func, any } from 'prop-types';
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
    console.log('selectedItems', selectedItems);
    const style = useStyles();
    const makeTreeItems = items => {
        // if (!items) return <p>Select org unit</p>;
        if (items.size === 0) return null;
        const nextItems = new Map(items);
        // const nextItems = [...items];
        // first entry of the map in the form of an array [key,value]
        const item = nextItems.entries().next().value;
        nextItems.delete(item[0]);
        const truncatedTree = (
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
        return truncatedTree;
    };

    return (
        <TreeView
            onClick={onClick}
            disableSelection
            expanded={
                Array.of(selectedItems.keys()).map(item => item.toString()) ??
                []
            }
            className={style.truncatedTreeview}
        >
            {makeTreeItems(selectedItems)}
        </TreeView>
    );
};

TruncatedTreeview.propTypes = {
    onClick: func.isRequired,
    // in fact array of Map()
    selectedItems: any,
};
TruncatedTreeview.defaultProps = {
    selectedItems: null,
};

export { TruncatedTreeview };
