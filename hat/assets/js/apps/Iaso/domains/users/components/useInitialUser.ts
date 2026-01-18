import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import get from 'lodash/get';
import { emailRegex } from '../../../libs/utils';
import { useGetUserRolesDropDown } from '../../userRoles/hooks/requests/useGetUserRoles';
import { UserRole } from '../../userRoles/types/userRoles';
import MESSAGES from '../messages';
import { InitialUserData, UserDialogData } from '../types';

export type InitialUserUtils = {
    user: UserDialogData;
    setFieldErrors: (fieldName, fieldError) => void;
    setFieldValue: (fieldName, fieldError) => void;
    setPhoneNumber: (phoneNumber: string, countryCode: string) => void;
    setEmail: (email: string) => void;
    hasErrors: boolean;
};

export const useInitialUser = (
    initialData: InitialUserData,
): InitialUserUtils => {
    const { formatMessage } = useSafeIntl();
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
            organization: {
                value: get(initialData, 'organization', undefined),
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
            editable_org_unit_type_ids: {
                value: get(initialData, 'editable_org_unit_type_ids', []),
                errors: [],
            },
            user_roles_editable_org_unit_type_ids: {
                value: get(
                    initialData,
                    'user_roles_editable_org_unit_type_ids',
                    [],
                ),
                errors: [],
            },
            has_multiple_accounts: {
                value: get(initialData, 'other_accounts', []).length > 0,
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
    const setFieldValue = useCallback(
        (fieldName, fieldValue) => {
            const newUser = {
                ...user,
            };
            newUser[fieldName] = {
                value: fieldValue,
                errors: [],
            };
            if (fieldName === 'send_email_invitation' && fieldValue) {
                newUser.password = {
                    value: null,
                    errors: [],
                };
            }
            if (fieldName === 'user_roles') {
                let user_roles_editable_org_unit_type_ids: any = [];
                const userRolesPermissions: UserRole[] = (userRoles || [])
                    .filter(userRole => fieldValue.includes(userRole.value))
                    .map(userRole => {
                        user_roles_editable_org_unit_type_ids = [
                            ...new Set([
                                ...user_roles_editable_org_unit_type_ids,
                                ...(userRole.original
                                    ?.editable_org_unit_type_ids ?? []),
                            ]),
                        ];
                        const role = {
                            ...(userRole.original as UserRole),
                            permissions: userRole.original?.permissions,
                        };
                        return role;
                    });
                newUser.user_roles_permissions = {
                    value: userRolesPermissions,
                    errors: [],
                };
                newUser.user_roles_editable_org_unit_type_ids = {
                    value: user_roles_editable_org_unit_type_ids,
                    errors: [],
                };
            }

            setUser(newUser);
        },
        [user, userRoles],
    );

    const setPhoneNumber = useCallback(
        (phoneNumber, countryCode) => {
            setUser({
                ...user,
                phone_number: { value: phoneNumber, errors: [] },
                country_code: { value: countryCode, errors: [] },
            });
        },
        [user],
    );
    const setEmail = useCallback(
        email => {
            setUser({
                ...user,
                email: {
                    value: email === '' ? undefined : email,
                    errors:
                        emailRegex.test(email) || email === ''
                            ? []
                            : [formatMessage(MESSAGES.invalidEmailFormat)],
                },
            });
        },
        [user, formatMessage],
    );
    const hasErrors = useMemo(() => {
        return Object.values(user).some(field => field.errors.length > 0);
    }, [user]);

    useEffect(() => {
        setUser(initialUser);
    }, [initialUser]);

    return useMemo(() => {
        return {
            user,
            setFieldValue,
            setFieldErrors,
            setPhoneNumber,
            setEmail,
            hasErrors,
        };
    }, [
        setFieldErrors,
        setFieldValue,
        user,
        setPhoneNumber,
        setEmail,
        hasErrors,
    ]);
};
