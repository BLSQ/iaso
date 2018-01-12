const request = require('superagent');

export function saveTeams(villagesList, planning_id) {
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