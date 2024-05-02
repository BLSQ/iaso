import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { OrgUnits } from '../domains/orgUnits/index';
import { Route } from './types';
import { ProtectedComponent } from './ProtectedComponent';

// TODO: add typing
const routes: Route[] = [
    {
        path: '/dashboard/home',
        element: <OrgUnits />,
    },
];

const protectedRoutes = routes.map((route: Route) => {
    const { element: Component } = route;
    return {
        ...route,
        element: <ProtectedComponent>{Component}</ProtectedComponent>,
    };
});

export const router = createBrowserRouter(protectedRoutes);
