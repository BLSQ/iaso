import React, { useMemo } from 'react';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    IconButton as IconButtonComponent,
} from 'bluesquare-components';
import MESSAGES from '../../constants/messages';
import { Column } from '../../../../../../hat/assets/js/apps/Iaso/types/table';

export const useBudgetColumns = (showOnlyDeleted = false): Column[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        const cols = [
            {
                Header: formatMessage(MESSAGES.obrName),
                accessor: 'obr_name',
            },
            {
                Header: formatMessage(MESSAGES.country),
                id: 'country__name',
                accessor: 'top_level_org_unit_name',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.virusNotificationDate),
                accessor: 'cvdpv2_notified_at',
            },
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'id',
                sortable: false,
                Cell: settings => {
                    return (
                        <>
                            {!showOnlyDeleted && (
                                <>
                                    <IconButtonComponent
                                        icon="edit"
                                        tooltipMessage={MESSAGES.edit}
                                        onClick={() =>
                                            console.log('EDIT', settings.value)
                                        }
                                    />
                                    {/* TODO uncomment when deletion is implemented */}
                                    {/* <IconButtonComponent
                                    icon="delete"
                                    tooltipMessage={MESSAGES.delete}
                                    onClick={() =>
                                        handleClickDeleteRow(settings.value)
                                    }
                                /> */}
                                </>
                            )}
                            {/* TODO uncomment when deletion is implemented */}
                            {/* {showOnlyDeleted && (
                            <IconButtonComponent
                                icon="restore-from-trash"
                                tooltipMessage={MESSAGES.restoreCampaign}
                                onClick={() =>
                                    handleClickRestoreRow(settings.value)
                                }
                            />
                        )} */}
                        </>
                    );
                },
            },
        ];
        // if (showOnlyDeleted) {
        //     cols.unshift({
        //         Header: formatMessage(MESSAGES.deleted_at),
        //         accessor: 'deleted_at',
        //         Cell: settings =>
        //             moment(settings.row.original.deleted_at).format('LTS'),
        //     });
        // }
        return cols;
    }, [formatMessage, showOnlyDeleted]);
};
