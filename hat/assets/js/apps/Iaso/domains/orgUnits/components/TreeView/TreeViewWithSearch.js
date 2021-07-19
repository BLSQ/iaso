import React, { useState, useCallback, useEffect } from 'react';
import {
    string,
    bool,
    func,
    object,
    number,
    oneOfType,
    array,
    arrayOf,
} from 'prop-types';
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
    minResultCount,
    inputLabelObject,
    withSearchButton,
    request,
    makeDropDownText,
    toolTip,
    parseNodeIds,
    onLabelClick,
    // onCheckBoxClick,
    multiselect,
    preselected,
    preexpanded,
}) => {
    const [selected, setSelected] = useState(multiselect ? [] : '');
    const [expanded, setExpanded] = useState([]);
    const [ticked, setTicked] = useState([]);
    // const [renderCount, setRenderCount] = useState(0);

    // useEffect(() => {
    //     console.log('ticked', ticked);
    //     setRenderCount(count => count + 1);
    // }, [ticked]);

    const onNodeSelect = useCallback(
        selection => {
            setSelected(selection);
            onSelect(selection);
        },
        [onSelect],
    );

    // useEffect(() => {
    //     console.log('effect!');
    //     if (multiselect && preselected) setTicked(preselected);
    //     if (!multiselect && preselected) setSelected(preselected);
    //     if (preexpanded) setExpanded(preexpanded); // doesn't work -> need to get id i.o name
    // }, [preselected, preexpanded, multiselect]);

    // Tick and untick checkbox
    const handleCheckbox = useCallback(
        (id, data) => {
            const newTicked = ticked.includes(id)
                ? ticked.filter(tickedId => tickedId !== id)
                : [...ticked, id];
            setTicked(newTicked);
            console.log('tick update', ticked, newTicked);
            onLabelClick(newTicked, data);
        },
        [onLabelClick, ticked],
    );

    const onSearchSelect = useCallback(
        searchSelection => {
            const idsToExpand = parseNodeIds(searchSelection).map(id =>
                id.toString(),
            );
            if (multiselect) {
                setExpanded([...expanded, ...idsToExpand]);
                const newSelected = [
                    ...selected,
                    idsToExpand[idsToExpand.length - 1],
                ];
                onNodeSelect(newSelected);
            } else {
                setExpanded(idsToExpand);
                onNodeSelect(idsToExpand[idsToExpand.length - 1]);
            }
        },
        [parseNodeIds, onNodeSelect, selected],
    );

    console.log('preexpanded', preexpanded);
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
                // key={`iasotreeview${renderCount.toString()}`}
                labelField={labelField}
                nodeField={nodeField}
                getChildrenData={getChildrenData}
                getRootData={getRootData}
                toggleOnLabelClick={toggleOnLabelClick}
                selected={selected}
                onSelect={onNodeSelect}
                expanded={expanded}
                onToggle={setExpanded}
                // onCheckBoxClick={handleCheckbox}
                onLabelClick={handleCheckbox}
                multiselect={multiselect}
                ticked={ticked}
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
    minResultCount: number,
    inputLabelObject: object,
    withSearchButton: bool,
    request: func.isRequired,
    makeDropDownText: func.isRequired,
    toolTip: func,
    parseNodeIds: func.isRequired,
    // onCheckBoxClick: func,
    onLabelClick: func,
    multiselect: bool,
    preselected: oneOfType([string, array]),
    preexpanded: arrayOf(string),
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
    // onCheckBoxClick: () => {},
    onLabelClick: () => {},
    multiselect: false,
    preselected: null,
    preexpanded: null,
};

export { TreeViewWithSearch };
