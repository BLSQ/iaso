import PropTypes, { string, bool, arrayOf, func, oneOf } from 'prop-types';
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
// const model = {
//     id: 'string',
//     name: 'string',
//     hasChildren: 'boolean',
// };
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
    // Experiment to pass type as object
    // dataModel,
}) => {
    const fetchChildrenData = useCallback(getChildrenData, []);
    // const fetchRootData = useCallback(getRootData(model), []);
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
                    key={`RootTreeItem ${item[nodeField]}`}
                    fetchChildrenData={fetchChildrenData}
                    expanded={expanded}
                    selected={selected}
                    // notifyParent={onToggle}
                    hasChildren={item.hasChildren}
                    toggleOnLabelClick={toggleOnLabelClick}
                    onIconClick={onIconClick}
                    // dataModel={dataModel}
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
    // dataModel: object,
    multiselect: bool,
    toggleOnLabelClick: bool,
    // TODO see if better to force array and adapt in single select case
    expanded: arrayOf(string).isRequired,
    onToggle: func.isRequired,
    onSelect: func,
    onIconClick: func,
    // selected: oneOf([PropTypes.string, PropTypes.arrayOf(string)]),
    selected: string,
};

IasoTreeView.defaultProps = {
    getChildrenData: () => {},
    getRootData: () => {},
    // dataModel: model,
    // dataModel: null,
    multiselect: false,
    toggleOnLabelClick: true,
    onSelect: () => {},
    onIconClick: () => {},
    selected: undefined,
};

export { IasoTreeView };
