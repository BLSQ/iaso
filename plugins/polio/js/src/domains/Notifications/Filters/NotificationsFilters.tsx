import React, { FunctionComponent } from 'react';
import { NotificationsParams } from '../types';
// import { NOTIFICATIONS_BASE_URL } from '../../../constants/routes';

// const baseUrl = NOTIFICATIONS_BASE_URL;
type Props = { params: NotificationsParams };

export const NotificationsFilters: FunctionComponent<Props> = ({ params }) => {
    console.log('NotificationsFilters', params);
    return <h1>Filtering</h1>;
};
