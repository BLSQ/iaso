import React, { FunctionComponent } from 'react';

import { AssignmentsApi } from '../types/assigment';

type Props = {
    assignments: AssignmentsApi;
};

export const AssignmentsMap: FunctionComponent<Props> = ({ assignments }) => {
    console.log('assignments', assignments);
    return <>MAP</>;
};
