type Properties = {
    name: string;
};

type Crs = {
    type: string;
    properties: Properties;
};

type Geometry = {
    type: string;
    coordinates: Array<any>;
};

type Features = {
    type: string;
    id: number;
    geometry: Geometry;
};

export type Shape = {
    type: string;
    crs: Crs;
    features: Features;
};

export type Shapes = Shape[];
