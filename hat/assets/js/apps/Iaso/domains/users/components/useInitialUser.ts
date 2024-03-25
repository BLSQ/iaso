import { useCallback, useEffect, useMemo, useState } from 'react';
import get from 'lodash/get';
import { InitialUserData, UserDialogData } from '../types';
import { UserRole } from '../../userRoles/types/userRoles';
import { useGetUserRolesDropDown } from '../hooks/useGetUserRolesDropDown';

export type InitialUserUtils = {
    user: UserDialogData;
    // eslint-disable-next-line no-unused-vars
    setFieldErrors: (fieldName, fieldError) => void;
    // eslint-disable-next-line no-unused-vars
    setFieldValue: (fieldName, fieldError) => void;
    // eslint-disable-next-line no-unused-vars
    setFormFieldsValue: (fieldName, fieldError, setFieldsValue) => void;
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
            projects: {
                value: get(initialData, 'projects', []).map(
                    project => project.id,
                ),
                errors: [],
            },
            phone_number: {
                value: get(initialData, 'phone_number', ''),
                errors: [],
            },
            country_code: {
                value: get(initialData, 'country_code', ''),
                errors: [],
            },
        };
    }, [initialData]);
    const [user, setUser] = useState<UserDialogData>(initialUser);

    const { data: userRoles } = useGetUserRolesDropDown();
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
    const setFormFieldsValue = useCallback(
        (fieldName, fieldValue, setFieldsValue) => {
            if (fieldName === 'phone_number_obj') {
                setFieldsValue(user.phone_number, {
                    value: fieldValue.phone_number,
                    errors: [],
                });

                setFieldsValue(user.country_code, {
                    value: fieldValue.country_code?.countryCode,
                    errors: [],
                });
            } else {
                setFieldsValue(fieldName, {
                    value: fieldValue,
                    errors: [],
                });
            }

            if (fieldName === 'user_roles') {
                const userRolesPermissions: UserRole[] = (userRoles || [])
                    .filter(userRole => fieldValue.includes(userRole.value))
                    .map(userRole => {
                        const role = {
                            ...(userRole.original as UserRole),
                            permissions: userRole.original?.permissions.map(
                                perm => perm.codename,
                            ),
                        };
                        return role;
                    });
                setFieldsValue(user.user_roles_permissions, {
                    value: userRolesPermissions,
                    errors: [],
                });
            }
        },
        [user, userRoles],
    );
    const setFieldValue = useCallback(
        (fieldName, fieldValue) => {
            const newUser = {
                ...user,
            };

            if (fieldName === 'phone_number_obj') {
                newUser.phone_number = {
                    value: fieldValue.phone_number,
                    errors: [],
                };
                newUser.country_code = {
                    value: fieldValue.country_code?.countryCode,
                    errors: [],
                };
            } else {
                newUser[fieldName] = {
                    value: fieldValue,
                    errors: [],
                };
            }

            if (fieldName === 'user_roles') {
                const userRolesPermissions: UserRole[] = (userRoles || [])
                    .filter(userRole => fieldValue.includes(userRole.value))
                    .map(userRole => {
                        const role = {
                            ...(userRole.original as UserRole),
                            permissions: userRole.original?.permissions.map(
                                perm => perm.codename,
                            ),
                        };
                        return role;
                    });
                newUser.user_roles_permissions = {
                    value: userRolesPermissions,
                    errors: [],
                };
            }

            setUser(newUser);
        },
        [user, userRoles],
    );

    useEffect(() => {
        setUser(initialUser);
    }, [initialUser]);

    return useMemo(() => {
        return { user, setFormFieldsValue, setFieldValue, setFieldErrors };
    }, [setFieldErrors, setFieldValue, setFormFieldsValue, user]);
};
