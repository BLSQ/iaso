import superagent from 'superagent';

function request(optionsList = []) {
    // Promise wrapper for superagent requests
    // The interface is similar to superagents method chaining, but different in that
    // translates a list of [methodName, ...args] to superagents method chaining. E.g.
    //
    // request([
    //   ['get', '/some-resource'],
    //   ['set', 'ContentType', 'application/json'],
    //   ['query', {'foo': 'bar'}]
    // ])
    //
    // becomes:
    //
    // request
    //   .get('/some-resource)
    //   .set('ContentType', 'application/json')
    //   .query({'foo': 'bar'})
    //
    return new Promise((resolve, reject) => {
        let req = superagent;
        try {
            optionsList.forEach(([method, ...args]) => {
                req = req[method](...args);
            });
            req.end((err, res) => {
                if (err) {
                    return reject(err);
                }
                return resolve(res.body);
            });
        } catch (ex) {
            console.error(ex);
            reject(ex);
        }
    });
}

export default request;
