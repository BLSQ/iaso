import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';

import { TableWithDeepLink } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from 'Iaso/constants/urls';
import { useGetColumns } from '../config/attachments';
import { useGetAttachments } from '../hooks/useGetAttachments';

import { useUploadAttachment } from '../hooks/useUploadAttachment';
import { FormParams } from '../types/forms';
import { AttachmentModal } from './AttachmentModal';

export const defaultSorted = [{ id: 'updated_at', desc: false }];

type Props = {
    params: FormParams;
};

export const FormAttachments: FunctionComponent<Props> = ({ params }) => {
    const { data: attachments, isFetching: isFetchingAttachments } =
        useGetAttachments(params);

    const { mutateAsync: upload, isLoading: isUploading } = useUploadAttachment(
        params.formId,
    );
    const columns = useGetColumns(params, attachments?.count ?? 0);
    return (
        <Box>
            <Box
                mb={2}
                justifyContent="flex-end"
                alignItems="center"
                display="flex"
            >
                <AttachmentModal
                    iconProps={{}}
                    upload={upload}
                    isUploading={isUploading}
                />
            </Box>
            <TableWithDeepLink
                marginTop={false}
                data={attachments?.results ?? []}
                pages={attachments?.pages ?? 1}
                defaultSorted={defaultSorted}
                columns={columns}
                count={attachments?.count ?? 0}
                baseUrl={baseUrls.formDetail}
                params={params}
                paramsPrefix="attachments"
                extraProps={{ loading: isFetchingAttachments || isUploading }}
            />
        </Box>
    );
};
