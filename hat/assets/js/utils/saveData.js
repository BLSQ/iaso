import { LOAD_ERROR, LOAD_SUCCESS_NO_DATA, LOAD_SUCCESS } from '../redux/load';

const request = require('superagent');

export function saveFullPlanning(villagesList, planning_id) {
    return request
        .put(`/api/plannings/${planning_id}/`)
        .set('Content-Type', 'application/json')
        .send(villagesList)
        .then(() => {
           return true;
        })
        .catch((err) => {
            return false
        })
}

export function saveVillageTeam(village, planning_id) {
    return request
        .patch(`/api/plannings/${planning_id}/`)
        .set('Content-Type', 'application/json')
        .send(village)
        .then(() => {
           return true;
        })
        .catch((err) => {
            return false
        })
}

export function saveTeamPlanning(villagesList, planning_id, team_id) {
    return request
        .put(`/api/teams/${team_id}/`)
        .set('Content-Type', 'application/json')
        .send({
          planning_id:planning_id,
          assignations: villagesList
        })
        .then(() => {
           return true;
        })
        .catch((err) => {
            return false
        })
}

export function saveFull(team, url) {
    return request
        .put(url)
        .set('Content-Type', 'application/json')
        .send(team)
        .then(() => {
           return true;
        })
        .catch((err) => {
            return false
        })
}

export function deleteFull(url) {
    return request
        .delete(url)
        .set('Content-Type', 'application/json')
        .then(() => {
           return true;
        })
        .catch((err) => {
            return false
        })
}

export function saveCoordinationPlanning(assignations, planning_id, coordination_id) {
    return request
        .put(`/api/coordinations/${coordination_id}/`)
        .set('Content-Type', 'application/json')
        .send({
          planning_id:planning_id,
          assignations: assignations
        })
        .then(() => {
           return true;
        })
        .catch((err) => {
            return false
        })
}

export function saveAreaInGeoloc(as_id, team) {
    return request
        .put(`/api/as/${as_id}/`)
        .set('Content-Type', 'application/json')
        .send(team) // PUT = {"team_id"}  / DELETE = {"team_id": 2, "delete": true}
        .then(() => {
           return true;
        })
        .catch((err) => {
            return false
        })
}


export function saveTest(test, dispatch) {
    return request
        .post('/api/checks/')
        .set('Content-Type', 'application/json')
        .send(test)
        .then(() => {
            dispatch({
                type: LOAD_SUCCESS_NO_DATA,
            })
           return true;
        })
        .catch((err) => {
            console.error(`Failing while saving test: ${err}`);
            dispatch({
              type: LOAD_ERROR,
              payload: err
            })
            return false
        })
}
