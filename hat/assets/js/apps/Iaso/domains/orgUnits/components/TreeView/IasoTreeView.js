import { string, bool, arrayOf, func } from 'prop-types';
import React, { useCallback } from 'react';
import { TreeView } from '@material-ui/lab';

import { EnrichedTreeItem } from './EnrichedTreeItem';
import { useAPI } from '../../../../utils/requests';

// class Model {
//     constructor() {
//         this.id = string;
//         this.name = string;
//         this.hasChildren = bool;
//         return this;
//     }
// }

// function treeviewElement(props, propName, componentName) {
//     if (
//         typeof props[propName].id !== 'string' ||
//         typeof props[propName].name !== 'string' ||
//         typeof props[propName].hasChildren !== 'boolean'
//     ) {
//         return new Error(
//             `Invalid prop \`${propName}\` supplied to` +
//                 ` \`${componentName}\`. Validation failed.`,
//         );
//     }
// }

const IasoTreeView = ({
    getChildrenData,
    getRootData,
    labelField, // name
    nodeField, // id
    multiselect,
    expanded,
    parentNotifier,
    toggleOnLabelClick,
    onSelect,
    onIconClick,
    // Experiment to pass type as object
    // dataModel,
}) => {
    const fetchChildrenData = useCallback(getChildrenData, []);
    const fetchRootData = useCallback(getRootData, []);
    const { data: rootData } = useAPI(fetchRootData);
    const onNodeToggle = (_event, nodeIds) => {
        parentNotifier(nodeIds);
    };
    const makeChildren = useCallback(
        data => {
            if (!data) return null;
            return data.map(item => (
                <EnrichedTreeItem
                    label={item[labelField]}
                    id={item[nodeField].toString()}
                    key={`RootTreeItem ${item[nodeField]}`}
                    fetchChildrenData={fetchChildrenData}
                    expanded={expanded}
                    notifyParent={parentNotifier}
                    hasChildren={item.hasChildren}
                    toggleOnLabelClick={toggleOnLabelClick}
                    onIconClick={onIconClick}
                />
            ));
        },
        [expanded],
    );
    return (
        <TreeView
            expanded={expanded}
            onNodeToggle={onNodeToggle}
            multiSelect={multiselect}
            onNodeSelect={onSelect}
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
    // dataModel: object,
    multiselect: bool,
    toggleOnLabelClick: bool,
    expanded: arrayOf(string).isRequired,
    parentNotifier: func.isRequired,
    onSelect: func,
    onIconClick: func,
};

IasoTreeView.defaultProps = {
    getChildrenData: () => {},
    getRootData: () => {},
    // dataModel: null,
    multiselect: true,
    toggleOnLabelClick: true,
    onSelect: () => {},
    onIconClick: () => {},
};

export { IasoTreeView };
