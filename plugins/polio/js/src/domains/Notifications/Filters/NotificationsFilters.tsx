import React, { FunctionComponent } from 'react';
import { NotificationsParams } from '../types';
import { useGetVdpvCategoriesDropdown } from '../hooks/api';

type Props = { params: NotificationsParams };

export const NotificationsFilters: FunctionComponent<Props> = ({ params }) => {
    const { data: entityTypesDropdown, isFetching: isFetchingEntityTypes } =
        useGetVdpvCategoriesDropdown();

    return <h1>Filtering</h1>;
};
