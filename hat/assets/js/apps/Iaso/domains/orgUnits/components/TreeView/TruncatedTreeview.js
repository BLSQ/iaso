import React from 'react';
import { arrayOf, func, string } from 'prop-types';
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
    console.log('truncatedTree prop', selectedItems);
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
                label={item.name}
                nodeId={item.id}
            >
                {items.length >= 1 ? makeTreeItems(nextItems) : null}
            </TreeItem>
        );
        return truncatedTree;
    };

    return (
        <TreeView
            onClick={onClick}
            disableSelection
            expanded={selectedItems ?? []}
            className={style.truncatedTreeview}
        >
            {makeTreeItems(selectedItems)}
        </TreeView>
    );
};

TruncatedTreeview.propTypes = {
    onClick: func.isRequired,
    selectedItems: arrayOf(string),
};
TruncatedTreeview.defaultProps = {
    selectedItems: null,
};

export { TruncatedTreeview };
