import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useQueries, useQuery } from 'react-query';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import { TreeItem, TreeView } from '@material-ui/lab';
import Grid from '@material-ui/core/Grid';
import { Map, TileLayer, GeoJSON } from 'react-leaflet';
import { geoJSON } from 'leaflet';
import { getRequest } from '../../libs/Api';
import SourceVersionSelector from '../../components/SourceVersionSelector/SourceVersionSelector';
import { selectDefaultVersionId } from '../../redux/selectors';
import { useSelector } from 'react-redux';

const defaultConfig = {
    staleTime: 1000 * 60 * 1,
    cacheTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
};

const useGetTree = slug => {
    return useQuery(
        ['orgunittree', slug],
        async () => getRequest(`/api/orgunits/tree?version_id=${slug}`),
        { ...defaultConfig, enabled: Boolean(slug) },
    );
};

const useGetShapes = slugs =>
    useQueries(
        slugs.map(slug => {
            return {
                queryKey: ['orgunitshape', slug],
                queryFn: () => getRequest(`/api/orgunits/${slug}/`),
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
    const defaultVersionId = useSelector(selectDefaultVersionId);
    const [version, setVersion] = useState(defaultVersionId);
    const { data, isFetching, error } = useGetTree(version);
    const [selectedNodes = [], setSelectedNodes] = useState();
    const queries = useGetShapes(selectedNodes);
    const shapes = queries
        .map(q => q.data)
        .filter(s => s && Boolean(s.geo_json));
    const bounds = useMemo(() => {
        const shape = shapes[0];
        if (!(shape && shape.geo_json)) return null;
        return geoJSON(shape.geo_json).getBounds();
    }, [shapes]);

    if (error) {
        return <>Error from server {error.toString()}</>;
    }
    const handleSelect = (event, nodeIds) => {
        setSelectedNodes(nodeIds);
    };

    return (
        <>
            <Grid container>
                <Grid container item md={4}>
                    <Grid item md={12}>
                        <SourceVersionSelector
                            value={version}
                            onChange={value => {
                                setVersion(value);
                            }}
                        />
                        {isFetching && 'Loading ...'}
                    </Grid>
                    <Grid item md={12}>
                        <TreeComponent
                            data={data}
                            onNodeSelected={handleSelect}
                        />
                    </Grid>
                </Grid>
                <Grid item md={8}>
                    <MapComponent bounds={bounds}>
                        {shapes.map(shape => (
                            <GeoJSON key={shape.id} data={shape.geo_json} />
                        ))}
                    </MapComponent>
                </Grid>
            </Grid>
        </>
    );
};

export default TreePage;
