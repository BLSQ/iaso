import React, { FunctionComponent } from 'react';
import { LinkTo } from '../../../components/nav/LinkTo';
import { baseUrls } from '../../../constants/urls';
import * as Permission from '../../../utils/permissions';
import { useCurrentUserHasPermission } from '../../users/utils';

type Props = {
    formId: string | number;
    formName?: string;
};

export const LinkToForm: FunctionComponent<Props> = ({ formId, formName }) => {
    const condition = useCurrentUserHasPermission(Permission.FORMS);
    const url = `/${baseUrls.formDetail}/formId/${formId}`;
    return <LinkTo condition={condition} url={url} text={formName} />;
};
