import React, { FunctionComponent } from 'react';

import { Link } from 'react-router';
import { useSelector } from 'react-redux';
import { userHasPermission } from '../../users/utils';
import { baseUrls } from '../../../constants/urls';

type Users = {
    current: any;
};
type State = {
    users: Users;
};
type Props = {
    formId: string;
    formName: unknown;
};
export const LinkToForm: FunctionComponent<Props> = ({ formId, formName }) => {
    const user: any = useSelector((state: State) => state.users.current);
    if (userHasPermission('iaso_forms', user)) {
        const formUrl = `/${baseUrls.formDetail}/formId/${formId}`;
        return <Link to={formUrl}>{formName}</Link>;
    }
    return <>{formName}</>;
};
