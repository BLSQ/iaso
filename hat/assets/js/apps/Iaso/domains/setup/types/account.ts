export type SaveAccountQuery = {
    account_name: string;
    user_username: string;
    user_first_name: string;
    user_last_name: string;
    user_email?: string;
    password: string;
    email_invitation: boolean;
    language: string;
    modules: string[];
};

export type Module = {
    name: string;
    codename: string;
};
