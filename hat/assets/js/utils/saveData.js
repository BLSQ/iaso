import { LOAD_ERROR, LOAD_SUCCESS_NO_DATA, LOAD_SUCCESS } from '../redux/load';

const request = require('superagent');

export function saveFullPlanning(villagesList, planning_id) {
    return request
        .put(`/api/plannings/${planning_id}/`)
        .set('Content-Type', 'application/json')
        .send(villagesList)
        .then(() => true)
        .catch(err => false);
}

export function saveVillageTeam(village, planning_id) {
    return request
        .patch(`/api/plannings/${planning_id}/`)
        .set('Content-Type', 'application/json')
        .send(village)
        .then(() => true)
        .catch(err => false);
}

export function saveTeamPlanning(villagesList, planning_id, team_id) {
    return request
        .put(`/api/teams/${team_id}/`)
        .set('Content-Type', 'application/json')
        .send({
            planning_id,
            assignations: villagesList,
        })
        .then(() => true)
        .catch(err => false);
}

export function saveFull(data, url) {
    return request
        .put(url)
        .set('Content-Type', 'application/json')
        .send(data)
        .then(() => true)
        .catch(err => false);
}
export function saveDuplicatePlanning(data, url) {
    return request
        .post(url)
        .set('Content-Type', 'application/json')
        .send(data)
        .then(() => true)
        .catch(err => false);
}

export function deleteFull(url) {
    return request
        .delete(url)
        .set('Content-Type', 'application/json')
        .then(() => true)
        .catch(err => false);
}

export function saveCoordinationPlanning(assignations, planning_id, coordination_id) {
    return request
        .put(`/api/coordinations/${coordination_id}/`)
        .set('Content-Type', 'application/json')
        .send({
            planning_id,
            assignations,
        })
        .then(() => true)
        .catch(err => false);
}

export function saveWorkzonePlanning(assignations, planning_id, workzone_id) {
    return request
        .patch(`/api/workzones/${workzone_id}/`)
        .set('Content-Type', 'application/json')
        .send({
            planning_id,
            assignations,
        })
        .then(() => true)
        .catch(err => false);
}


export function saveTest(test, dispatch) {
    return request
        .post('/api/checks/')
        .set('Content-Type', 'application/json')
        .send(test)
        .then(() => {
            dispatch({
                type: LOAD_SUCCESS_NO_DATA,
            });
            return true;
        })
        .catch((err) => {
            console.error(`Failing while saving test: ${err}`);
            dispatch({
                type: LOAD_ERROR,
                payload: err,
            });
            return false;
        });
}
