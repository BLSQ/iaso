const request = require('superagent');

export function saveTeams(villagesList, planning_id) {
    console.log(villagesList);
    request
        .put(`/api/plannings/${planning_id}`)
        .set('Content-Type', 'application/json')
        .send(villagesList) // query string
        .then((response) => {
            console.log(response);
        })
        .catch((err) => {
            console.log(err);
            return false
        })
}