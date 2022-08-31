/* eslint-disable camelcase */
import React, { ReactElement, useMemo } from 'react';
import {
    // @ts-ignore
    IconButton as IconButtonComponent,
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';

import moment from 'moment';
import _ from 'lodash';
import { LinkToOrgUnit } from '../../orgUnits/components/LinkToOrgUnit';
import {
    DateCell,
    DateTimeCell,
    DateTimeCellRfc,
} from '../../../components/Cells/DateTimeCell';

import { Gender } from './components/fieldsValue/Gender';
import { Age } from './components/fieldsValue/Age';
import { LastVisit } from './components/fieldsValue/LastVisit';
import { VaccinationNumber } from './components/fieldsValue/VaccinationNumber';
import { RegistrationDate } from './components/fieldsValue/RegistrationDate';

// import DeleteDialog from '../../../components/dialogs/DeleteDialogComponent';

import { IntlFormatMessage } from '../../../types/intl';
import MESSAGES from '../messages';

import { baseUrls } from '../../../constants/urls';

import { Column } from '../../../types/table';
import getDisplayName from '../../../utils/usersUtils';

export const baseUrl = baseUrls.beneficiaries;

// TODO: ADD program, vaccine number, gender columns
export const useColumns = (): Array<Column> => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    return useMemo(
        () => [
            {
                Header: formatMessage(MESSAGES.name),
                id: 'name',
                accessor: 'name',
                Cell: settings => {
                    return (
                        <>
                            {settings.row.original?.attributes?.file_content
                                ?.name ?? '--'}
                        </>
                    );
                },
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
                Cell: (settings): ReactElement => (
                    <LastVisit instances={settings.row.original.instances} />
                ),
            },
            {
                Header: formatMessage(MESSAGES.program),
                id: 'attributes__program',
                accessor: 'attributes__program',
                Cell: settings => {
                    return (
                        <>
                            {settings.row.original?.attributes?.file_content
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
                    return settings.row.original?.attributes?.org_unit ? (
                        <LinkToOrgUnit
                            orgUnit={
                                settings.row.original?.attributes?.org_unit
                            }
                        />
                    ) : (
                        <>--</>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.registrationDate),
                accessor: 'attributes__file_content_end',
                Cell: settings => (
                    <RegistrationDate beneficiary={settings.row.original} />
                ),
            },
            {
                Header: formatMessage(MESSAGES.vaccinationNumber),
                sortable: false,
                accessor: 'attributes__file_content__vaccination_number',
                id: 'attributes__file_content__vaccination_number',
                Cell: settings => (
                    <VaccinationNumber beneficiary={settings.row.original} />
                ),
            },
            {
                Header: formatMessage(MESSAGES.age),
                // TODO: MAKE IT SORTABLE
                sortable: false,
                accessor: 'attributes__file_content__birth_date',
                id: 'attributes__file_content__birth_date',
                Cell: settings => <Age beneficiary={settings.row.original} />,
            },
            {
                Header: formatMessage(MESSAGES.gender),
                // TODO: MAKE IT SORTABLE
                sortable: false,
                accessor: 'attributes__file_content__gender',
                id: 'attributes__file_content__gender',
                Cell: settings => (
                    <Gender beneficiary={settings.row.original} />
                ),
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
                            url={`/${baseUrls.entityDetails}/entityId/${settings.row.original.id}`}
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
        ],
        [formatMessage],
    );
};

const generateColumnsFromFieldsList = (
    fields: string[],
    formatMessage: IntlFormatMessage,
): Column[] => {
    return fields.map(field => {
        return {
            Header: formatMessage(MESSAGES[field]) ?? field,
            id: `${field}`,
            accessor: `${field}`,
            Cell: settings => {
                const data = _.get(settings.row.original, field);
                const asDateTime = moment(data, 'DD-MM-YYYYThh:mm:ssZ', true);
                const asDate = moment(data, 'DD-MM-YYYY', true);
                if (asDateTime.isValid()) {
                    return (
                        <DateTimeCellRfc value={moment(data).format('LTS')} />
                    );
                }
                if (asDate.isValid()) {
                    return <DateCell value={moment(data).format('L')} />;
                }

                return <>{data ?? '--'}</>;
            },
        };
    });
};

export const useColumnsFromFieldsList = (
    fields: Array<string> = [],
): Array<Column> => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () => generateColumnsFromFieldsList(fields, formatMessage),
        [fields, formatMessage],
    );
};

export const useBeneficiariesDetailsColumns = (
    entityId: number | null,
    fields: Array<string> = [],
): Column[] => {
    const { formatMessage } = useSafeIntl();
    const columnsFromList: Column[] = useColumnsFromFieldsList(fields);
    return useMemo(
        () => [
            {
                Header: formatMessage(MESSAGES.form),
                // TODO make sortable
                sortable: false,
                id: 'form_name',
                accessor: 'form_name',
            },
            {
                Header: formatMessage(MESSAGES.created_at),
                // TODO make sortable
                sortable: false,
                id: 'created_at',
                accessor: 'created_at',
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.last_sync_at),
                // TODO make sortable
                // TODO get correct key when implemented on backend
                sortable: false,
                id: 'last_sync_at',
                accessor: 'last_sync_at',
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.OrgUnitName),
                // TODO make sortable
                sortable: false,
                id: 'org_unit.name',
                accessor: 'org_unit.name',
            },
            {
                Header: formatMessage(MESSAGES.keyInfo),
                // TODO get correct key when implemented on backend
                sortable: false,
                id: 'key_info',
                accessor: 'key_info',
                // eslint-disable-next-line no-unused-vars
                Cell: _settings => {
                    return <>--</>;
                },
            },
            {
                Header: formatMessage(MESSAGES.submitter),
                // TODO make sortable
                sortable: false,
                id: 'created_by.user_name',
                accessor: 'created_by.user_name',
                Cell: settings => {
                    const { created_by: user } = settings.row.original;
                    return <>{getDisplayName(user)}</>;
                },
            },
            ...columnsFromList,
            {
                Header: formatMessage(MESSAGES.actions),
                sortable: false,
                id: 'actions',
                Cell: (settings): ReactElement => (
                    // TODO: limit to user permissions
                    <section>
                        <IconButtonComponent
                            url={`/${baseUrls.entitySubmissionDetail}/instanceId/${settings.row.original.id}/entityId/${entityId}`}
                            icon="remove-red-eye"
                            tooltipMessage={MESSAGES.see}
                            disabled={!entityId}
                        />
                    </section>
                ),
            },
        ],
        [entityId, columnsFromList, formatMessage],
    );
};
