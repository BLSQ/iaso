import React, { FunctionComponent } from 'react';

import { Link } from 'react-router';
import { userHasPermission } from '../../users/utils';
import { baseUrls } from '../../../constants/urls';
import { useCurrentUser } from '../../../utils/usersUtils';

type Props = {
    formId: string | number;
    formName: unknown;
};

export const LinkToForm: FunctionComponent<Props> = ({ formId, formName }) => {
    const user = useCurrentUser();
    if (userHasPermission('iaso_forms', user)) {
        const formUrl = `/${baseUrls.formDetail}/formId/${formId}`;
        return <Link to={formUrl}>{formName}</Link>;
    }
    return <>{formName}</>;
};
