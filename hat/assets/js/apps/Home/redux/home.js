import moment from 'moment';

export const FETCH_ACTION = 'hat/home/FETCH_ACTION';
export const SET_GEO_ZONES = 'hat/home/SET_GEO_ZONES';
export const SET_GEO_PROVINCES = 'hat/home/SET_GEO_PROVINCES';
export const SET_ZONES = 'hat/home/SET_ZONES';
export const SET_BAR_CHART_DATAS = 'hat/home/SET_BAR_CHART_DATAS';

const req = require('superagent');

const setGeoZones = payload => ({
    type: SET_GEO_ZONES,
    payload,
});

const setGeoProvinces = payload => ({
    type: SET_GEO_PROVINCES,
    payload,
});

const setZones = payload => ({
    type: SET_ZONES,
    payload,
});

const setBarChartDatas = payload => ({
    type: SET_BAR_CHART_DATAS,
    payload,
});


export const fetchGeoJson = (dispatch) => {
    const currentYear = new Date().getFullYear() - 1;
    const years = [1, 2, 3].map(i => currentYear - i);
    req
        .get(`/api/home/?id=1&map=true&years=${years}`)
        .set('Content-Type', 'application/json')
        .then((res) => {
            dispatch(setZones(res.body));
            req
                .get('/api/home/?id=1&map=true&geojson=true')
                .set('Content-Type', 'application/json')
                .then((resGoe) => {
                    dispatch(setGeoZones(resGoe.body.zones));
                    dispatch(setGeoProvinces(resGoe.body.provinces));
                })
                .catch((err) => {
                    console.error(`Error while loading geo json: ${err}`);
                });
        })
        .catch((err) => {
            console.error(`Error while loading zones: ${err}`);
        });
    return ({
        type: FETCH_ACTION,
    });
};

const mapBarChartDatas = (datas) => {
    const mappedDatas = [];
    datas.forEach((d) => {
        mappedDatas.push({
            date: moment(d.date).format('YYYY'),
            value: d.positive_confirmation_test_count,
        });
    });
    return mappedDatas;
};

export const fetchChartBarDatas = (dispatch) => {
    const dateFrom = moment().subtract(13, 'year').format('YYYY-MM-DD');
    const dateTo = moment().subtract(1, 'year').format('YYYY-MM-DD');
    req
        .get(`/api/home/?chart=true&from=${dateFrom}&to=${dateTo}`)
        .set('Content-Type', 'application/json')
        .then((res) => {
            dispatch(setBarChartDatas(mapBarChartDatas(res.body)));
        })
        .catch((err) => {
            console.error(`Error while bar chart datas: ${err}`);
        });
    return ({
        type: FETCH_ACTION,
    });
};

export const homeInitialState = {
    geoZones: null,
    geoProvinces: null,
    zones: [],
    barChartDatas: [],
};

export const homeActions = {
    fetchGeoJson,
    fetchChartBarDatas,
};


export const homeReducer = (state = homeInitialState, action = {}) => {
    switch (action.type) {
        case FETCH_ACTION: {
            return {
                ...state,
            };
        }

        case SET_GEO_ZONES: {
            const geoZones = action.payload;
            return {
                ...state,
                geoZones,
            };
        }

        case SET_GEO_PROVINCES: {
            const geoProvinces = action.payload;
            return {
                ...state,
                geoProvinces,
            };
        }

        case SET_ZONES: {
            const zones = action.payload;
            return {
                ...state,
                zones,
            };
        }

        case SET_BAR_CHART_DATAS: {
            const barChartDatas = action.payload;
            return {
                ...state,
                barChartDatas,
            };
        }

        default:
            return state;
    }
};
