import { useCallback, useEffect, useMemo, useState } from 'react';
import get from 'lodash/get';
import { InitialUserData, UserDialogData } from '../types';

export type InitialUserUtils = {
    user: UserDialogData;
    resetUser: () => void;
    // eslint-disable-next-line no-unused-vars
    setFieldErrors: (fieldName, fieldError) => void;
    // eslint-disable-next-line no-unused-vars
    setFieldValue: (fieldName, fieldError) => void;
};

export const useInitialUser = (
    initialData: InitialUserData,
): InitialUserUtils => {
    const initialUser: UserDialogData = useMemo(() => {
        return {
            id: { value: get(initialData, 'id', null), errors: [] },
            user_name: {
                value: get(initialData, 'user_name', ''),
                errors: [],
            },
            first_name: {
                value: get(initialData, 'first_name', ''),
                errors: [],
            },
            last_name: {
                value: get(initialData, 'last_name', ''),
                errors: [],
            },
            email: { value: get(initialData, 'email', ''), errors: [] },
            password: { value: '', errors: [] },
            permissions: {
                value: get(initialData, 'permissions', []),
                errors: [],
            },
            org_units: {
                value: get(initialData, 'org_units', []),
                errors: [],
            },
            language: {
                value: get(initialData, 'language', ''),
                errors: [],
            },
            home_page: {
                value: get(initialData, 'home_page', ''),
                errors: [],
            },
            dhis2_id: {
                value: get(initialData, 'dhis2_id', ''),
                errors: [],
            },
            user_roles: {
                value: get(initialData, 'user_roles', []),
                errors: [],
            },
            user_roles_permissions: {
                value: get(initialData, 'user_roles_permissions', []),
                errors: [],
            },
            user_permissions: {
                value: get(initialData, 'user_permissions', []),
                errors: [],
            },
            send_email_invitation: {
                value: get(initialData, 'send_email_invitation', false),
                errors: [],
            },
        };
    }, [initialData]);
    const [user, setUser] = useState<UserDialogData>(initialUser);
    const resetUser = useCallback(() => setUser(initialUser), [initialUser]);
    const setFieldErrors = useCallback(
        (fieldName, fieldError) => {
            setUser({
                ...user,
                [fieldName]: {
                    value: user[fieldName].value,
                    errors: [fieldError],
                },
            });
        },
        [user],
    );
    const setFieldValue = useCallback(
        (fieldName, fieldValue) => {
            setUser({
                ...user,
                [fieldName]: {
                    value: fieldValue,
                    errors: [],
                },
            });
        },
        [user],
    );

    useEffect(() => {
        setUser(initialUser);
    }, [initialUser]);

    return useMemo(() => {
        return { user, resetUser, setFieldValue, setFieldErrors };
    }, [resetUser, setFieldErrors, setFieldValue, user]);
};
