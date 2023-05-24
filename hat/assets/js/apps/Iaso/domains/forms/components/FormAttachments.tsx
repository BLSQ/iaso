import React, { FunctionComponent } from 'react';
import { Box } from '@material-ui/core';
import { useGetAttachments } from '../hooks/useGetAttachments';

type Props = {
    formId: string;
};

export const FormAttachments: FunctionComponent<Props> = ({ formId }) => {
    const { data: attachments, isFetching: isFetchingAttachments } =
        useGetAttachments(formId);

    console.log('attachments', attachments);
    return (
        <Box mt={4}>
            {/* <Box
                mb={2}
                justifyContent="flex-end"
                alignItems="center"
                display="flex"
            >
                <FormVersionsDialog
                    formId={formId}
                    periodType={periodType}
                    titleMessage={MESSAGES.createFormVersion}
                    renderTrigger={({ openDialog }) => (
                        <AddButtonComponent
                            onClick={openDialog}
                            message={MESSAGES.createFormVersion}
                        />
                    )}
                    onConfirmed={() => setForceRefresh(true)}
                />
            </Box> */}
            {/* <SingleTable
                isFullHeight={false}
                baseUrl={baseUrl}
                endPointPath="formversions"
                exportButtons={false}
                dataKey="form_versions"
                defaultPageSize={20}
                fetchItems={(d, url, signal) =>
                    fetchList(
                        d,
                        `${url}&form_id=${formId}`,
                        'fetchFormVersionsError',
                        'form versions',
                        signal,
                    )
                }
                defaultSorted={[{ id: defaultOrder, desc: true }]}
                columns={formVersionsTableColumns(
                    intl.formatMessage,
                    setForceRefresh,
                    formId,
                    periodType,
                )}
                multiSelect
                selection={selection}
                setTableSelection={(selectionType, items, totalCount) => {
                    setSelection(
                        setTableSelection(
                            selection,
                            selectionType,
                            items,
                            totalCount,
                        ),
                    );
                }}
                forceRefresh={forceRefresh}
                onForceRefreshDone={() => setForceRefresh(false)}
            /> */}
        </Box>
    );
};
