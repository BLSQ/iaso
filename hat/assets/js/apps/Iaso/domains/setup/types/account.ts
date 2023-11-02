/* eslint-disable camelcase */
export type SaveAccountQuery = {
    account_name: string;
    user_username: string;
    user_first_name: string;
    user_last_name: string;
    password: string;
    modules: Module[];
};

export type Module = {
    name: string;
    codename: string;
};
