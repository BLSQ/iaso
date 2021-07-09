import React, { useState } from 'react';
import { string, bool, func } from 'prop-types';
import { IasoTreeView } from './IasoTreeView';

const SingleSelectTreeView = ({
    labelField, // name
    nodeField, // id
    getChildrenData,
    getRootData,
    toggleOnLabelClick,
    onSelect,
}) => {
    const [expanded, setExpanded] = useState([]);
    return (
        <IasoTreeView
            labelField={labelField}
            nodeField={nodeField}
            multiselect={false}
            expanded={expanded}
            parentNotifier={setExpanded}
            getChildrenData={getChildrenData}
            getRootData={getRootData}
            toggleOnLabelClick={toggleOnLabelClick}
            onSelect={onSelect}
        />
    );
};

SingleSelectTreeView.propTypes = {
    getChildrenData: func,
    getRootData: func,
    labelField: string.isRequired,
    nodeField: string.isRequired,
    // dataModel: object,
    toggleOnLabelClick: bool,
    onSelect: func,
};

SingleSelectTreeView.defaultProps = {
    getChildrenData: () => {},
    getRootData: () => {},
    // dataModel: null,
    toggleOnLabelClick: true,
    onSelect: () => {},
};
export { SingleSelectTreeView };
