import React, { FunctionComponent } from 'react';
import { userHasPermission } from '../../users/utils';
import { baseUrls } from '../../../constants/urls';
import { useCurrentUser } from '../../../utils/usersUtils';
import * as Permission from '../../../utils/permissions';
import { LinkTo } from '../../../components/nav/LinkTo';

type Props = {
    formId: string | number;
    formName?: string;
};

export const LinkToForm: FunctionComponent<Props> = ({ formId, formName }) => {
    const user = useCurrentUser();
    const condition = userHasPermission(Permission.FORMS, user);
    const url = `/${baseUrls.formDetail}/formId/${formId}`;
    return <LinkTo condition={condition} url={url} text={formName} />;
};
