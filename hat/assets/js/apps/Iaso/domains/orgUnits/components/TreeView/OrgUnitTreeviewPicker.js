import { func, any } from 'prop-types';
import React from 'react';
import { Paper } from '@material-ui/core';

import { IconButton } from 'bluesquare-components';
import { MESSAGES } from './messages';
import { TruncatedTreeview } from './TruncatedTreeview';

const OrgUnitTreeviewPicker = ({ onClick, selectedItems, resetSelection }) => {
    const makeTruncatedTrees = treesData => {
        if (treesData.size === 0)
            return <p onClick={onClick}>Select org unit</p>;
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
        return treeviews;
    };
    return (
        <Paper variant="outlined" elevation={0}>
            {makeTruncatedTrees(selectedItems)}
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
    // map with other maps as values: {id:{id:name}}
    selectedItems: any,
    resetSelection: func,
};
OrgUnitTreeviewPicker.defaultProps = {
    selectedItems: [],
    resetSelection: null,
};

export { OrgUnitTreeviewPicker };
