export const sendRequest = (method, path, body) => {
    const requestInit = {
        method,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    };

    return fetch(path, requestInit).then(response => response.json());
};