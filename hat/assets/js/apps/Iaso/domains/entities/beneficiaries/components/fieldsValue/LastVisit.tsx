import React, { FunctionComponent } from 'react';

import moment from 'moment';

type Props = {
    instances: Record<string, any>[];
};

export const LastVisit: FunctionComponent<Props> = ({ instances }) => {
    const sortedInstances = [...instances].sort((a, b) =>
        moment(a.created_at).isBefore(moment(b.created_at)) ? 1 : 0,
    );
    return (
        <>
            {sortedInstances[0]
                ? moment(sortedInstances[0].created_at).format('LTS')
                : '-'}
        </>
    );
};
