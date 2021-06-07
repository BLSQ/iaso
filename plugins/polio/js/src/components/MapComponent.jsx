import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import { useRef } from 'react';

import "leaflet/dist/leaflet.css";

const geoJSON = {
    "type": "FeatureCollection",
    "crs": {
        "type": "name",
        "properties": {
            "name": "EPSG:4326"
        }
    },
    "features": [
        {
            "type": "Feature",
            "id": 20617,
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": [
                    [
                        [
                            [
                                -13.1867,
                                8.4829
                            ],
                            [
                                -13.1848,
                                8.4748
                            ],
                            [
                                -13.2108,
                                8.4323
                            ],
                            [
                                -13.2523,
                                8.4019
                            ],
                            [
                                -13.2668,
                                8.3958
                            ],
                            [
                                -13.2837,
                                8.421
                            ],
                            [
                                -13.2882,
                                8.4185
                            ],
                            [
                                -13.294,
                                8.4227
                            ],
                            [
                                -13.2885,
                                8.4271
                            ],
                            [
                                -13.2932,
                                8.4368
                            ],
                            [
                                -13.2837,
                                8.4363
                            ],
                            [
                                -13.2793,
                                8.4415
                            ],
                            [
                                -13.2782,
                                8.4565
                            ],
                            [
                                -13.2887,
                                8.4871
                            ],
                            [
                                -13.2985,
                                8.494
                            ],
                            [
                                -13.2971,
                                8.4987
                            ],
                            [
                                -13.2932,
                                8.494
                            ],
                            [
                                -13.2868,
                                8.4996
                            ],
                            [
                                -13.2737,
                                8.4932
                            ],
                            [
                                -13.2813,
                                8.4893
                            ],
                            [
                                -13.2798,
                                8.4754
                            ],
                            [
                                -13.2682,
                                8.4974
                            ],
                            [
                                -13.2557,
                                8.4848
                            ],
                            [
                                -13.2482,
                                8.4943
                            ],
                            [
                                -13.2393,
                                8.4885
                            ],
                            [
                                -13.2332,
                                8.4935
                            ],
                            [
                                -13.2201,
                                8.491
                            ],
                            [
                                -13.2154,
                                8.4946
                            ],
                            [
                                -13.2029,
                                8.4907
                            ],
                            [
                                -13.2024,
                                8.4813
                            ],
                            [
                                -13.1867,
                                8.4829
                            ]
                        ]
                    ]
                ]
            },
            "properties": {}
        }
    ]
};
const shape = L.geoJSON(geoJSON);

const InnerMap = () => {
    const map = useMap()
    map.fitBounds(shape.getBounds())
    return <GeoJSON data={geoJSON} />
}

export const MapComponent = () => {
    const mapRef = useRef()

    return (
        <MapContainer
            ref={mapRef}
            style={{ height: 500 }}
            center={[0,0]}
            bounds={shape.getBounds()}
            zoom={13}
            when
            scrollWheelZoom={false}
        >
            <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <InnerMap />
        </MapContainer>
    );
};