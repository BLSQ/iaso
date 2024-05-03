import { ReactElement } from 'react';

export type Route = {
    path: string;
    element: ReactElement;
    errorElement?: ReactElement; // eg: ErrorBoundary
    // eslint-disable-next-line no-unused-vars
    action?: ({ request }) => any;
    // eslint-disable-next-line no-unused-vars
    loader?: ({ request, params }) => any;
};
