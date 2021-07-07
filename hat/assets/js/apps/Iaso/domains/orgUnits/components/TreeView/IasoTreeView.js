import { string } from 'prop-types';
import React, { useCallback, useState } from 'react';
import { TreeView } from '@material-ui/lab';

import { EnrichedTreeItem } from './EnrichedTreeItem';
import { useAPI, iasoGetRequest } from '../../../../utils/requests';

const getChildrenData = async id =>
    iasoGetRequest({
        disableSuccessSnackBar: true,
        requestParams: {
            url: `/api/orgunits/?&parent_id=${id}&defaultVersion=true&validation_status=all`,
        },
    });

const getRootData = async () =>
    iasoGetRequest({
        disableSuccessSnackBar: true,
        requestParams: {
            url: `/api/orgunits/?&rootsForUser=true&defaultVersion=true&validation_status=all`,
        },
    });

const IasoTreeView = ({
    // getChildrenData,
    // getRootData,
    labelField, // name
    nodeField, // id
    // Experimen to pass type as object
    // dataModel,
}) => {
    const fetchChildrenData = useCallback(getChildrenData, []);
    const fetchRootData = useCallback(getRootData, []);
    const { data: rootData } = useAPI(fetchRootData);
    const [expanded, setExpanded] = useState([]);
    const onNodeToggle = (_event, nodeIds) => {
        console.log('Hello Toggle', nodeIds, expanded);
        setExpanded(nodeIds);
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
                    notifyParent={setExpanded}
                />
            ));
        },
        [expanded],
    );
    return (
        <TreeView expanded={expanded} onNodeToggle={onNodeToggle}>
            {rootData && makeChildren(rootData.orgUnits)}
        </TreeView>
    );
};

IasoTreeView.propTypes = {
    // getChildrenData: func,
    // getRootData: func,
    labelField: string.isRequired,
    nodeField: string.isRequired,
    // dataModel: object,
};

IasoTreeView.defaultProps = {
    // getChildrenData: () => {},
    // getRootData: () => {},
    // dataModel: null,
};

export { IasoTreeView };
