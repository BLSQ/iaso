export const cleanDatabase = async () => {
    return await fetch(
        new URL(
            '/api/ft-helpers/clean-database/',
            process.env?.ORVAL_API_BASE_URL ?? 'http://localhost:8000',
        ),
        { method: 'POST' },
    );
};

type CreateUserAndGetTokenParams = {
    account_name: string;
    username: string;
    password: string;
    is_superuser?: boolean;
    is_staff?: boolean;
    feature_flags?: string[];
};

export const createUserAndGetToken = async ({
    account_name,
    username,
    password,
    is_superuser = false,
    is_staff = false,
    feature_flags = [],
}: CreateUserAndGetTokenParams) => {
    await fetch(
        new URL(
            '/api/ft-helpers/create-user/',
            process.env?.ORVAL_API_BASE_URL ?? 'http://localhost:8000',
        ),
        {
            method: 'POST',
            body: JSON.stringify({
                username: username,
                password: password,
                is_superuser: is_superuser,
                is_staff: is_staff,
                feature_flags: feature_flags,
                account_name: account_name,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        },
    ).then(response => {
        if (!response.ok) {
            throw new Error(response.statusText);
        }
        return response;
    });

    const data = await fetch(
        new URL(
            '/api/token/',
            process.env?.ORVAL_API_BASE_URL ?? 'http://localhost:8000',
        ),
        {
            method: 'POST',
            body: JSON.stringify({
                username: username,
                password: password,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        },
    ).then(response => {
        if (!response.ok) {
            throw new Error(response.statusText);
        }
        return response.json();
    });

    return data?.access;
};
