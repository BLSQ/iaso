import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useQueries, useQuery } from 'react-query';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import { TreeItem, TreeView } from '@material-ui/lab';
import Grid from '@material-ui/core/Grid';
import { Map, TileLayer, GeoJSON } from 'react-leaflet';
import { geoJSON } from 'leaflet';
import { sendRequest } from '../pages/networking';

const defaultConfig = {
    staleTime: 1000 * 60 * 1,
    cacheTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
};

const useGetDSTree = () =>
    useQuery(
        ['datasource.tree'],
        async () => {
            return sendRequest('GET', `/api/orgunits/tree_source_data`);
        },
        defaultConfig,
    );

const useGetTree = slug =>
    useQuery(
        ['orgunittree', slug],
        async () => {
            return sendRequest('GET', `/api/orgunits/tree?version_id=${slug}`);
        },
        defaultConfig,
    );

const useGetShapes = slugs =>
    useQueries(
        slugs.map(slug => {
            return {
                queryKey: ['orgunitshape', slug],
                queryFn: () => sendRequest('GET', `/api/orgunits/${slug}/`),
                enabled: Boolean(slug),
                ...defaultConfig,
            };
        }),
    );

const Label = node => (
    <>
        {node.name} {node.type && node.type} ({node.id})
        {node.num_children > 0 && (
            <span style={{ color: 'grey' }}> {node.num_children}</span>
        )}
        {node.has_geo_json && ' 🌍'}
    </>
);
const renderTree = node => (
    <TreeItem key={node.id} nodeId={node.id} label={Label(node)}>
        {Array.isArray(node.children)
            ? node.children.map(c => renderTree(c))
            : null}
    </TreeItem>
);

const TreeComponent = ({ data, onNodeSelected }) => {
    if (!data) return null;
    return (
        <TreeView
            // className={classes.root}
            defaultCollapseIcon={<ExpandMoreIcon />}
            defaultExpanded={['0']}
            defaultExpandIcon={<ChevronRightIcon />}
            onNodeSelect={onNodeSelected}
            multiSelect
        >
            {renderTree(data)}
        </TreeView>
    );
};

const MapComponent = ({ children, bounds }) => {
    const map = useRef();
    useEffect(() => {
        if (bounds && bounds.isValid()) {
            map.current.leafletElement.panInsideBounds(bounds);
        }
    }, [bounds]);

    return (
        <Map ref={map} style={{ height: 1000 }} center={[0, 20]} zoom={4}>
            <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {children}
        </Map>
    );
};

const TreePage = () => {
    const { data, isFetching, error } = useGetTree(39);
    const [selectedNodes = [], setSelectedNodes] = useState();
    const queries = useGetShapes(selectedNodes);
    const shapes = queries.map(q => q.data);
    const bounds = useMemo(() => {
        const shape = shapes[0];
        if (!(shape && shape.geo_json)) return null;
        return geoJSON(shape.geo_json).getBounds();
    }, [shapes[0]]);

    if (error) {
        return <>Error from server {error.toString()}</>;
    }
    const handleSelect = (event, nodeIds) => {
        setSelectedNodes(nodeIds);
    };

    return (
        <>
            <Grid container>
                <Grid item xs={6}>
                    {isFetching && 'Loading ...'}
                    <TreeComponent data={data} onNodeSelected={handleSelect} />
                </Grid>
                <Grid item xs={6}>
                    <MapComponent bounds={bounds}>
                        {shapes
                            .filter(s => s && Boolean(s.geo_json))
                            .map(shape => (
                                <GeoJSON key={shape.id} data={shape.geo_json} />
                            ))}
                    </MapComponent>
                </Grid>
            </Grid>
        </>
    );
};

export default TreePage;
