import React from 'react';

import { useQuery } from 'react-query';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import { TreeItem, TreeView } from '@material-ui/lab';
import { sendRequest } from '../pages/networking';

export const useGetDSTree = () =>
    useQuery(
        ['datasource.tree'],
        async () => {
            // additional props are WIP
            return sendRequest('GET', `/api/orgunits/tree_source_data`);
        },
        { staleTime: 5, refetchOnWindowFocus: false },
    );

export const useGetTree = slug =>
    useQuery(
        ['orgunittree', slug],
        async () => {
            // additional props are WIP
            return sendRequest('GET', `/api/orgunits/tree?version_id=${slug}`);
        },
        { staleTime: 5, refetchOnWindowFocus: false },
    );

const Label = node => (
    <>
        {node.name} {node.type && node.type} ({node.id})
        {node.num_children > 0 && (
            <span style={{ color: 'grey' }}> {node.num_children}</span>
        )}
    </>
);
const renderTree = node => (
    <TreeItem key={node.id} nodeId={node.id} label={Label(node)}>
        {Array.isArray(node.children)
            ? node.children.map(c => renderTree(c))
            : null}
    </TreeItem>
);

const TreeComponent = ({ data }) => {
    return (
        <TreeView
            // className={classes.root}
            defaultCollapseIcon={<ExpandMoreIcon />}
            defaultExpanded={['0']}
            defaultExpandIcon={<ChevronRightIcon />}
        >
            {renderTree(data)}
        </TreeView>
    );
};

const TreePage = () => {
    // const { data, isFetching, error } = useGetDSTree();
    const { data, isFetching, error } = useGetTree(4);

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
            <TreeComponent data={data} />
        </>
    );
};

export default TreePage;
