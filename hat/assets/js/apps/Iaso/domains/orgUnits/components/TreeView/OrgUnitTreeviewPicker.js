import { arrayOf, func, string } from 'prop-types';
import React from 'react';
import { Paper } from '@material-ui/core';
import { TreeView, TreeItem } from '@material-ui/lab';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import { makeStyles } from '@material-ui/core/styles';
import { result } from 'lodash-es';

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

const OrgUnitTreeviewPicker = ({ onClick, selectedItems }) => {
    const uniqueItems = selectedItems?.map((item, index) => `${item}-${index}`);
    // console.log('Picker', selectedItems);
    const style = useStyles();
    const makeTreeItems = items => {
        if (!items) return <p>Select org unit</p>;
        if (items.length === 0) return null;
        const nextItems = [...items];
        const item = nextItems.shift();
        console.log('making item', item, nextItems);
        const prout = (
            <TreeItem
                key={item + nextItems.length.toString()}
                className={style.truncatedTreeview}
                onIconClick={e => e.preventDefault()}
                onLabelClick={e => e.preventDefault()}
                collapseIcon={<ExpandMoreIcon />}
                expandIcon={<ChevronRightIcon />}
                label={item}
                nodeId={item}
            >
                {items.length >= 1 ? makeTreeItems(nextItems) : null}
            </TreeItem>
        );
        console.log('prout', prout);
        return prout;
    };
    return (
        <Paper variant="outlined" elevation={0} onClick={onClick}>
            <TreeView
                disableSelection
                expanded={uniqueItems ?? []}
                className={style.truncatedTreeview}
            >
                {makeTreeItems(uniqueItems)}
            </TreeView>
        </Paper>
    );
};

OrgUnitTreeviewPicker.propTypes = {
    onClick: func.isRequired,
    selectedItems: arrayOf(string),
};
OrgUnitTreeviewPicker.defaultProps = {
    selectedItems: null,
};

export { OrgUnitTreeviewPicker };

// renderTrigger = {({ openDialog }) => (
//     <IconButtonComponent
//         onClick={openDialog}
//         icon="globe"
//         tooltipMessage={MESSAGES.search}
//     />
// )}
