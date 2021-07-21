import { string, bool, arrayOf, func, array, oneOfType } from 'prop-types';
import React, { useCallback } from 'react';
import { TreeView } from '@material-ui/lab';

import { EnrichedTreeItem } from './EnrichedTreeItem';
import { useAPI } from '../../../../utils/requests';

const IasoTreeView = ({
    getChildrenData,
    getRootData,
    labelField, // name
    nodeField, // id
    multiselect,
    expanded,
    selected,
    onToggle,
    toggleOnLabelClick,
    onSelect,
    onCheckBoxClick,
    onLabelClick,
    ticked,
    parentsTicked,
}) => {
    // TODO add additional state to manage checkbox state
    // TODO add checkbox if multiselect
    const fetchChildrenData = useCallback(getChildrenData, []);
    const fetchRootData = useCallback(getRootData, []);
    const { data: rootData } = useAPI(fetchRootData);
    const onNodeToggle = (_event, nodeIds) => {
        onToggle(nodeIds);
    };
    const onNodeSelect = (_event, selection) => {
        onSelect(selection);
    };
    const makeChildren = useCallback(
        data => {
            if (!data) return null;
            return data.map(item => (
                <EnrichedTreeItem
                    label={item[labelField]}
                    id={item[nodeField].toString()}
                    data={item.data}
                    key={`RootTreeItem ${item[nodeField]}`}
                    fetchChildrenData={fetchChildrenData}
                    expanded={expanded}
                    selected={selected}
                    hasChildren={item.hasChildren}
                    toggleOnLabelClick={toggleOnLabelClick}
                    onCheckBoxClick={onCheckBoxClick}
                    onLabelClick={onLabelClick}
                    withCheckbox={multiselect}
                    ticked={ticked}
                    parentsTicked={parentsTicked}
                />
            ));
        },
        [expanded, ticked],
    );
    return (
        <TreeView
            expanded={expanded}
            selected={selected}
            multiSelect={multiselect}
            onNodeSelect={onNodeSelect}
            onNodeToggle={onNodeToggle}
        >
            {rootData && makeChildren(rootData)}
        </TreeView>
    );
};

IasoTreeView.propTypes = {
    getChildrenData: func,
    getRootData: func,
    labelField: string.isRequired,
    nodeField: string.isRequired,
    multiselect: bool,
    toggleOnLabelClick: bool,
    // TODO see if better to force array and adapt in single select case
    expanded: arrayOf(string).isRequired,
    onToggle: func.isRequired,
    onSelect: func,
    onCheckBoxClick: func,
    onLabelClick: func,
    selected: oneOfType([string, arrayOf(string)]),
    // selected: string || array,
    ticked: array,
    parentsTicked: array,
};

IasoTreeView.defaultProps = {
    getChildrenData: () => {},
    getRootData: () => {},
    multiselect: false,
    toggleOnLabelClick: true,
    onSelect: () => {},
    onCheckBoxClick: () => {},
    onLabelClick: () => {},
    selected: undefined,
    ticked: [],
    parentsTicked: [],
};

export { IasoTreeView };
