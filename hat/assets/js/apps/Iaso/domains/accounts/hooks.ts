import {
    AccountRetrieveCurrent,
    useApiAccountsMeRetrieve,
} from 'Iaso/api/accounts';

export const useCurrentAccount = (): AccountRetrieveCurrent | undefined => {
    const { data: account } = useApiAccountsMeRetrieve();
    return account;
};

export const useHasNoAccount = (): boolean => {
    const currentAccount = useCurrentAccount();
    return !currentAccount;
};
