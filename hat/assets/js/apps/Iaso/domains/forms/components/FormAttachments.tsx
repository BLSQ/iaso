import React, { FunctionComponent, ReactElement } from 'react';
import { Box } from '@material-ui/core';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router';
import { useSafeIntl, IconButton } from 'bluesquare-components';
import GetAppIcon from '@material-ui/icons/GetApp';

import { redirectToReplace } from '../../../routing/actions';
import { useGetAttachments } from '../hooks/useGetAttachments';
import { TableWithDeepLink } from '../../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../../constants/urls';
import { FormParams } from '../types/forms';
import { Column } from '../../../types/table';
import MESSAGES from '../messages';
import { DateTimeCell } from '../../../components/Cells/DateTimeCell';
import DeleteDialog from '../../../components/dialogs/DeleteDialogComponent';
import { useDeleteAttachment } from '../hooks/useDeleteAttachment';
import { useUploadAttachment } from '../hooks/useUploadAttachment';
import { AttachmentModal } from './AttachmentModal';

export const defaultSorted = [{ id: 'updated_at', desc: false }];

type Props = {
    formId: string;
    params: FormParams;
};

const useGetColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: deleteAttachment } = useDeleteAttachment();
    return [
        {
            Header: formatMessage(MESSAGES.name),
            accessor: 'name',
        },
        {
            Header: 'MD5',
            accessor: 'md5',
        },
        {
            Header: formatMessage(MESSAGES.created_at),
            accessor: 'created_at',
            Cell: DateTimeCell,
        },
        {
            Header: formatMessage(MESSAGES.updated_at),
            accessor: 'updated_at',
            Cell: DateTimeCell,
        },
        {
            Header: formatMessage(MESSAGES.actions),
            accessor: 'actions',
            sortable: false,
            Cell: (settings: any): ReactElement => {
                return (
                    <>
                        <Link href={settings.row.original.file} download>
                            <IconButton
                                onClick={() => null}
                                tooltipMessage={MESSAGES.download}
                                overrideIcon={GetAppIcon}
                            />
                        </Link>
                        <DeleteDialog
                            titleMessage={{
                                ...MESSAGES.deleteAttachment,
                                values: {
                                    attachmentName: settings.row.original.name,
                                },
                            }}
                            message={{
                                ...MESSAGES.deleteWarning,
                                values: {
                                    planningName: settings.row.original.name,
                                },
                            }}
                            onConfirm={() =>
                                deleteAttachment(settings.row.original.id)
                            }
                        />
                    </>
                );
            },
        },
    ];
};

export const FormAttachments: FunctionComponent<Props> = ({
    formId,
    params,
}) => {
    const { data: attachments, isFetching: isFetchingAttachments } =
        useGetAttachments(formId, params);

    const { mutateAsync: upload, isLoading: isUploading } =
        useUploadAttachment(formId);
    const dispatch = useDispatch();
    const columns = useGetColumns();
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
                onTableParamsChange={p =>
                    dispatch(redirectToReplace(baseUrls.formDetail, p))
                }
            />
        </Box>
    );
};
