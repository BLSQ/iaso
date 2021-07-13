import React, { useState, useCallback } from 'react';
import { string, bool, func, object, number } from 'prop-types';
import { DynamicSelect } from './DynamicSelect';
import { MESSAGES } from './messages';
import { IasoTreeView } from './IasoTreeView';

const TreeViewWithSearch = ({
    labelField, // name
    nodeField, // id
    getChildrenData,
    getRootData,
    toggleOnLabelClick,
    onSelect,
    // onSearchSelect,
    minResultCount,
    inputLabelObject,
    withSearchButton,
    request,
    makeDropDownText,
    toolTip,
    parseNodeIds,
}) => {
    const [selected, setSelected] = useState('');
    const [expanded, setExpanded] = useState([]);

    const onNodeSelect = useCallback(
        selection => {
            setSelected(selection);
            onSelect(selection);
        },
        [onSelect],
    );

    const onSearchSelect = useCallback(
        searchSelection => {
            const idsToExpand = parseNodeIds(searchSelection).map(id =>
                id.toString(),
            );
            // setExpanded(idsToExpand);
            // TODO fix data problem
            setExpanded(['1092839', '1092035', '1091431']);
            // setSelected(idsToExpand[0]);
        },
        [parseNodeIds],
    );

    return (
        <>
            <DynamicSelect
                onSelect={onSearchSelect}
                minResultCount={minResultCount}
                inputLabelObject={inputLabelObject}
                withSearchButton={withSearchButton}
                request={request}
                makeDropDownText={makeDropDownText}
                toolTip={toolTip}
            />
            <IasoTreeView
                labelField={labelField}
                nodeField={nodeField}
                getChildrenData={getChildrenData}
                getRootData={getRootData}
                toggleOnLabelClick={toggleOnLabelClick}
                selected={selected}
                onSelect={onNodeSelect}
                expanded={expanded}
                onToggle={setExpanded}
            />
        </>
    );
};

TreeViewWithSearch.propTypes = {
    getChildrenData: func,
    getRootData: func,
    labelField: string.isRequired,
    nodeField: string.isRequired,
    toggleOnLabelClick: bool,
    onSelect: func,
    // onSearchSelect: func.isRequired,
    minResultCount: number,
    inputLabelObject: object,
    withSearchButton: bool,
    request: func.isRequired,
    makeDropDownText: func.isRequired,
    toolTip: func,
    parseNodeIds: func.isRequired,
};

TreeViewWithSearch.defaultProps = {
    getChildrenData: () => {},
    getRootData: () => {},
    toggleOnLabelClick: true,
    onSelect: () => {},
    minResultCount: 50,
    inputLabelObject: MESSAGES.search,
    withSearchButton: false,
    toolTip: null,
};

export { TreeViewWithSearch };
