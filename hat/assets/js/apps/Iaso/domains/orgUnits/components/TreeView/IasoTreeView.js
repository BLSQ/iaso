import { string, bool, arrayOf, func } from 'prop-types';
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
    onIconClick,
    onLabelClick,
}) => {
    // TODO add additional state to manage checkbox state
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
                    onIconClick={onIconClick}
                    onLabelClick={onLabelClick}
                />
            ));
        },
        [expanded],
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
    onIconClick: func,
    onLabelClick: func,
    // selected: oneOf([PropTypes.string, PropTypes.arrayOf(string)]),
    selected: string,
};

IasoTreeView.defaultProps = {
    getChildrenData: () => {},
    getRootData: () => {},
    multiselect: false,
    toggleOnLabelClick: true,
    onSelect: () => {},
    onIconClick: () => {},
    onLabelClick: () => {},
    selected: undefined,
};

export { IasoTreeView };
