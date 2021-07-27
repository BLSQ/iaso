import React from 'react';

import { useQuery } from 'react-query';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import { TreeItem, TreeView } from '@material-ui/lab';
import { sendRequest } from '../pages/networking';

export const useGetTree = slug =>
    useQuery(
        ['orgunittree', slug],
        async () => {
            // additional props are WIP
            return sendRequest('GET', `/api/orgunits/tree_source_data`);
        },
        { staleTime: 5, refetchOnWindowFocus: false },
    );

const Label = node => (
    <>
        {node.name} {node.type && node.type}
        {node.num_children > 0 && (
            <span style={{ color: 'grey' }}> {node.num_children}</span>
        )}
    </>
);

const TreeComponent = () => {
    const { data, isFetching, error } = useGetTree(2);

    const renderTree = node => (
        <TreeItem key={node.id} nodeId={node.id} label={Label(node)}>
            {Array.isArray(node.children)
                ? node.children.map(c => renderTree(c))
                : null}
        </TreeItem>
    );
    if (error) {
        return error.toString();
    }
    if (isFetching) {
        return 'Loading';
    }

    if (data === undefined) return 'data is undefined';

    return (
        <>
            {isFetching && 'Loading ...'}
            <TreeView
                // className={classes.root}
                defaultCollapseIcon={<ExpandMoreIcon />}
                defaultExpanded={['0']}
                defaultExpandIcon={<ChevronRightIcon />}
            >
                {renderTree(data)}
            </TreeView>
        </>
    );
};

export default TreeComponent;
