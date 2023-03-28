import React, { FunctionComponent } from 'react';
import { useGetInstance } from '../hooks/useGetInstance';
import { Instance } from '../../types/instance';
import { InstanceDetailRaw } from './InstanceDetailRaw';

type Props = {
    instanceId: string | undefined;
};

const InstanceDetail: FunctionComponent<Props> = ({ instanceId }) => {
    const {
        data,
        isLoading,
        isError,
    }: { data?: Instance; isLoading: boolean; isError: boolean } =
        useGetInstance(instanceId);

    return (
        <InstanceDetailRaw
            data={data}
            isLoading={isLoading}
            isError={isError}
        />
    );

    // const { formatMessage } = useSafeIntl();

    // if (isLoading)
    //     return (
    //         <Box height="70vh">
    //             <LoadingSpinner
    //                 fixed={false}
    //                 transparent
    //                 padding={4}
    //                 size={25}
    //             />
    //         </Box>
    //     );
    // if (isError) {
    //     return <ErrorPaperComponent message={formatMessage(MESSAGES.error)} />;
    // }
    // return (
    //     <>
    //         <Box mb={4}>
    //             <Typography variant="h5" color="secondary">
    //                 {`${formatMessage(
    //                     MESSAGES.submissionTitle,
    //                 )} - ${instanceId}`}
    //             </Typography>
    //         </Box>
    //         <WidgetPaper
    //             expandable
    //             isExpanded={false}
    //             title={formatMessage(MESSAGES.infos)}
    //             padded
    //         >
    //             <InstanceDetailsInfos currentInstance={data} />
    //         </WidgetPaper>
    //         <WidgetPaper
    //             expandable
    //             isExpanded={false}
    //             title={formatMessage(MESSAGES.location)}
    //         >
    //             <InstanceDetailsLocation currentInstance={data} />
    //         </WidgetPaper>
    //         <WidgetPaper title={formatMessage(MESSAGES.form)}>
    //             <InstanceFileContent instance={data} />
    //         </WidgetPaper>
    //     </>
    // );
};

export default InstanceDetail;
