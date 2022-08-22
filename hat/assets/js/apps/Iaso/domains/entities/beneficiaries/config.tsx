/* eslint-disable camelcase */
import React, { ReactElement } from 'react';
import {
    // @ts-ignore
    IconButton as IconButtonComponent,
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';

import moment from 'moment';
import { LinkToOrgUnit } from '../../orgUnits/components/LinkToOrgUnit';
import { DateCell } from '../../../components/Cells/DateTimeCell';

import { AgeCell } from './components/AgeCell';

// import DeleteDialog from '../../../components/dialogs/DeleteDialogComponent';

import { IntlFormatMessage } from '../../../types/intl';
import MESSAGES from '../messages';

import { baseUrls } from '../../../constants/urls';

import { Column } from '../../../types/table';

export const baseUrl = baseUrls.beneficiaries;

// TODO: ADD program, vaccine number, gender columns
export const useColumns = (): Array<Column> => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    return [
        {
            Header: formatMessage(MESSAGES.name),
            id: 'name',
            accessor: 'name',
        },
        {
            Header: formatMessage(MESSAGES.id),
            id: 'uuid',
            accessor: 'uuid',
        },
        {
            Header: formatMessage(MESSAGES.lastVisit),
            id: 'instances__created_at',
            // TODO: MAKE IT SORTABLE
            sortable: false,
            accessor: 'instances__created_at',
            Cell: (settings): ReactElement => {
                const { instances } = settings.row.original;
                const sortedInstances = [...instances].sort((a, b) =>
                    moment(a.created_at).isBefore(moment(b.created_at)) ? 1 : 0,
                );
                return (
                    <section>
                        {sortedInstances[0]
                            ? moment(sortedInstances[0].created_at).format(
                                  'LTS',
                              )
                            : '-'}
                    </section>
                );
            },
        },
        {
            Header: formatMessage(MESSAGES.program),
            id: 'attributes__program',
            accessor: 'attributes__program',
            Cell: settings => {
                return (
                    <>
                        {settings.row.original.attributes.file_content
                            ?.program ?? '--'}
                    </>
                );
            },
        },
        {
            Header: 'HC',
            id: 'attributes__org_unit__name',
            accessor: 'attributes__org_unit__name',
            Cell: settings => {
                return settings.row.original.attributes?.org_unit ? (
                    <LinkToOrgUnit
                        orgUnit={settings.row.original.attributes.org_unit}
                    />
                ) : (
                    <>--</>
                );
            },
        },
        {
            Header: formatMessage(MESSAGES.registrationDate),
            accessor: 'attributes__file_content_end',
            Cell: settings => {
                const cellInfo = {
                    value: settings.row.original.attributes.file_content.end,
                };
                return <DateCell value={cellInfo} />;
            },
        },
        {
            Header: formatMessage(MESSAGES.vaccinationNumber),
            sortable: false,
            accessor: 'attributes__file_content__vaccination_number',
            id: 'attributes__file_content__vaccination_number',
            Cell: settings => {
                const { vaccination_number } =
                    settings.row.original.attributes.file_content;
                return <>{vaccination_number ?? '--'}</>;
            },
        },
        {
            Header: formatMessage(MESSAGES.age),
            // TODO: MAKE IT SORTABLE
            sortable: false,
            accessor: 'attributes__file_content__birth_date',
            id: 'attributes__file_content__birth_date',
            Cell: settings => (
                <AgeCell
                    birthDate={
                        settings.row.original.attributes.file_content.birth_date
                    }
                    age={settings.row.original.attributes.file_content.age}
                    ageType={
                        settings.row.original.attributes.file_content.age_type
                    }
                />
            ),
        },
        {
            Header: formatMessage(MESSAGES.gender),
            // TODO: MAKE IT SORTABLE
            sortable: false,
            accessor: 'attributes__file_content__gender',
            id: 'attributes__file_content__gender',
            Cell: settings => {
                const { gender } =
                    settings.row.original.attributes.file_content;
                return <>{gender ? formatMessage(MESSAGES[gender]) : '--'}</>;
            },
        },
        {
            Header: formatMessage(MESSAGES.actions),
            accessor: 'actions',
            resizable: false,
            sortable: false,
            Cell: (settings): ReactElement => (
                // TODO: limit to user permissions
                <section>
                    <IconButtonComponent
                        url={`/${baseUrls.beneficiariesDetails}/beneficiaryId/${settings.row.original.id}`}
                        icon="remove-red-eye"
                        tooltipMessage={MESSAGES.see}
                    />
                    {/* <DeleteDialog
                        keyName="entity"
                        disabled={settings.row.original.instances_count > 0}
                        titleMessage={MESSAGES.deleteTitle}
                        message={MESSAGES.deleteText}
                        onConfirm={() => deleteEntity(settings.row.original)}
                    /> */}
                </section>
            ),
        },
    ];
};
