export const sendRequest = async (method, path, body) => {
    const requestInit = {
        method,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    };

    const response = await fetch(path, requestInit);

    if (!response.ok) {
        let res;
        try {
            res = await response.json();
        } catch {
            res = new Error('Api Error');
        }

        throw res;
    }

    if (response.status === 204) return;

    return await response.json();
};
