import React, { FunctionComponent } from 'react';
import { Box } from '@material-ui/core';

import { useGetInstance } from './hooks/useGetInstance';

interface IProps {
    params: any;
}

const DuplicatesSubmissions: FunctionComponent<IProps> = ({ params }) => {
    const { data: instance } = useGetInstance(params.instanceId);
    const { data: duplicate } = useGetInstance(params.duplicateInstanceId);

    return (
        <Box>
            {instance?.uuid}
            {duplicate?.uuid}
        </Box>
    );
};

export default DuplicatesSubmissions;
