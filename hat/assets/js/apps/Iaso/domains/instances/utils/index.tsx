/* eslint-disable camelcase */
import React, {
    FunctionComponent,
    ReactElement,
    useMemo,
    useCallback,
} from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { Tooltip } from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import CallMade from '@mui/icons-material/CallMade';
import {
    truncateText,
    useSafeIntl,
    getTableUrl,
    Column,
    Setting,
    RenderCell,
    IntlFormatMessage,
} from 'bluesquare-components';

import instancesTableColumns from '../config';
import MESSAGES from '../messages';
import { VisibleColumn } from '../types/visibleColumns';
import { Instance, ShortFile } from '../types/instance';

import {
    apiDateTimeFormat,
    apiDateFormat,
    getFromDateString,
    getToDateString,
} from '../../../utils/dates';
import ActionTableColumnComponent from '../components/ActionTableColumnComponent';
import { PossibleField } from '../../forms/types/forms';
import { getCookie } from '../../../utils/cookies';

import DeleteDialog from '../components/DeleteInstanceDialog';
import ExportInstancesDialogComponent from '../components/ExportInstancesDialogComponent';

import { fetchLatestOrgUnitLevelId } from '../../orgUnits/utils';
import { baseUrls } from '../../../constants/urls';

import { Selection } from '../../orgUnits/types/selection';

import { userHasOneOfPermissions, userHasPermission } from '../../users/utils';

import { User, useCurrentUser } from '../../../utils/usersUtils';
import * as Permission from '../../../utils/permissions';

const NO_VALUE = '/';
// eslint-disable-next-line no-unused-vars
const hasNoValue: (value: string) => boolean = value => !value || value === '';

type KeyValueFieldsProps = {
    entry: Record<string, string>;
};

const KeyValueFields: FunctionComponent<KeyValueFieldsProps> = ({ entry }) => (
    <>
        {Object.entries(entry).map(([key, value]: [string, string]) => (
            <>
                <span>
                    {`${key} : ${hasNoValue(value) ? NO_VALUE : value}`}
                </span>
                <br />
            </>
        ))}
    </>
);

type Field = {
    label?: string | Record<string, string>;
    name: string;
};
type Locales = {
    fr: string[];
    en: string[];
    es: string[];
    pt: string[];
};

/*
The array of strings 'labelLocales' is used to handle different formats for multilingual labels.
Some forms use the format 'label::French' or 'label::English', while others use lowercase locales like 'label::french' or 'label::english'.
Additionally, to align with ODK standards (https://docs.getodk.org/guide-form-language/#guide-form-language-building),
the format 'label::French (fr)', 'label::English (en)', 'label::Español (es)', and 'label::Português (pt)' is also supported.
We also include the locale codes 'fr', 'en', 'es', and 'pt' to cover cases where labels might be defined using just the locale code.
This array-based approach ensures compatibility with all these formats without disrupting the display for older multilingual forms.
*/
const labelLocales: Locales = {
    fr: [
        'French',
        'french',
        'Français (fr)',
        'fr',
        'français (fr)',
        'fre',
        'fra',
        'français',
        'francés',
        'francês',
        'frances',
    ],
    en: [
        'English',
        'english',
        'English (en)',
        'en',
        'english (en)',
        'eng',
        'anglais',
        'inglés',
        'inglês',
        'ingles',
    ],
    es: [
        'Spanish',
        'spanish',
        'Español (es)',
        'es',
        'español (es)',
        'spa',
        'español',
        'espagnol',
        'espanhol',
        'espanol',
    ],
    pt: [
        'Portuguese',
        'portuguese',
        'Português (pt)',
        'pt',
        'português (pt)',
        'por',
        'português',
        'portugais',
        'portugués',
        'portugues',
    ],
};

const localizeLabel = (field: Field): string => {
    // Localize a label. Sometimes a label may be a string, that is somewhat json but not totally
    // sometime it's already a Mapping.
    const locale: string = getCookie('django_language') ?? 'en';
    let localeOptions: Record<string, string> = { [field.name]: field.name };

    if (typeof field === 'object') {
        if (typeof field.label === 'string') {
            // Replacing all single quotes used as apostrophe into html entities, and put it back after replacing other single quotes into double quotes
            const apostrophe = /(?<=[\p{Letter}])'(?=[\p{Letter}])/gu;
            let label: string = (field.label || '').replaceAll(
                apostrophe,
                '&apos;',
            );
            label = label.replaceAll("'", '"');
            label = label.replaceAll('&apos;', "'");
            const wrongDoubleQuotes = /(?<=[\p{Letter}])"(?=[\p{Letter}])/gu;
            label = label.replace(wrongDoubleQuotes, "'");

            try {
                localeOptions = JSON.parse(label);
            } catch (e) {
                // some fields are using single quotes. Logging just for info, this can be deleted if it clutters the console
                console.warn('Error parsing JSON', label, e);
                return field.name;
            }
        } else if (
            typeof field.label === 'object' &&
            !Array.isArray(field.label)
        ) {
            localeOptions = field.label;
        }
    } else {
        localeOptions = field;
    }

    const localeKey = labelLocales[locale].find(key => localeOptions[key]);
    return localeKey ? localeOptions[localeKey] : field.name;
};
/**
 * Pretty Format value for display
 * Try to guess if it is a date or datetime to display in appropriate locale
 * @param value string
 */
export const formatValue = (value: string): string => {
    // use strict mode so it doesn't try to interpret number as timestamp.
    const asDay = moment(value, apiDateFormat, true);
    if (asDay.isValid()) {
        return asDay.format('L');
    }
    const asDT = moment(value, apiDateTimeFormat, true);
    if (asDT.isValid()) {
        return asDT.format('LTS');
    }
    return value;
};
export const formatLabel = (field: Field): string => {
    if (!field.label) return field.name;
    if (typeof field.label === 'object' || field.label?.charAt(0) === '{')
        return localizeLabel(field);
    if (!field.label.trim()) return field.name;
    if (field.label.includes(':')) return field.label.split(':')[0];
    if (field.label.includes('$')) return field.label.split('$')[0];
    return field.label;
};

const renderValue = (settings: Setting<Instance>, c: VisibleColumn) => {
    const { key } = c;
    // eslint-disable-next-line camelcase
    const { file_content } = settings.row.original;
    const value = file_content[key];

    if (hasNoValue(value)) {
        return <span>{NO_VALUE}</span>;
    }
    if (Array.isArray(value)) {
        return (
            <pre style={{ textAlign: 'left' }}>
                {value.map((val, index) => (
                    <>
                        <KeyValueFields key={`arr${index}`} entry={val} />
                        <br />
                    </>
                ))}
            </pre>
        );
    }
    return <span>{formatValue(value)}</span>;
};

export const useGetInstancesColumns = (
    // eslint-disable-next-line no-unused-vars
    getActionCell: RenderCell = settings => (
        <ActionTableColumnComponent settings={settings} />
    ),
    // eslint-disable-next-line no-unused-vars
): ((visibleColumns: VisibleColumn[]) => Column[]) => {
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();
    const metasColumns = useMemo(
        () => [...instancesTableColumns(formatMessage)],
        [formatMessage],
    );
    const getInstancesColumns = useCallback(
        (visibleColumns: VisibleColumn[]) => {
            let tableColumns: Column[] = [];
            metasColumns.forEach(c => {
                const metaColumn = visibleColumns.find(
                    vc => vc.key === c.accessor,
                );
                if (
                    (metaColumn && metaColumn.active) ||
                    c.accessor === 'actions'
                ) {
                    tableColumns.push(c);
                }
            });

            const childrenArray: Column[] = [];
            visibleColumns
                .filter(c => !c.meta)
                .forEach(c => {
                    if (c.active) {
                        childrenArray.push({
                            class: 'small',
                            sortable: false,
                            accessor: c.key,
                            Header: (
                                <Tooltip
                                    title={formatMessage(
                                        MESSAGES.instanceHeaderTooltip,
                                        {
                                            label: c.label,
                                            key: c.key,
                                        },
                                    )}
                                >
                                    <span>
                                        {c.label?.trim()
                                            ? truncateText(c.label, 25)
                                            : c.key}
                                    </span>
                                </Tooltip>
                            ),
                            Cell: settings => renderValue(settings, c),
                        });
                    }
                });
            tableColumns = tableColumns.concat(childrenArray);
            if (
                userHasOneOfPermissions(
                    [Permission.SUBMISSIONS_UPDATE, Permission.SUBMISSIONS],
                    currentUser,
                )
            ) {
                tableColumns.push({
                    Header: formatMessage(MESSAGES.actions),
                    accessor: 'actions',
                    resizable: false,
                    sortable: false,
                    width: 150,
                    Cell: getActionCell,
                });
            }
            return tableColumns;
        },
        [currentUser, formatMessage, getActionCell, metasColumns],
    );
    return getInstancesColumns;
};

type Props = {
    order?: string;
    defaultOrder: string;
};

type PossibleColumn = {
    accessor: string;
    Header: string;
    id?: string;
    sortable?: boolean;
    // eslint-disable-next-line no-unused-vars
    Cell?: (s: any) => ReactElement;
    align?: 'left' | 'center';
};

export const useGetInstancesVisibleColumns = ({
    order,
    defaultOrder,
}: Props): ((
    // eslint-disable-next-line no-unused-vars
    columns?: string,
    // eslint-disable-next-line no-unused-vars
    possibleFields?: PossibleField[],
) => VisibleColumn[]) => {
    const { formatMessage } = useSafeIntl();
    const activeOrders: string[] = useMemo(
        () => (order || defaultOrder).split(','),
        [defaultOrder, order],
    );
    const getInstancesVisibleColumns = useCallback(
        (columns?: string, possibleFields?: PossibleField[]) => {
            const columnsNames: string[] = columns ? columns.split(',') : [];
            const metasColumns: PossibleColumn[] = [
                ...instancesTableColumns(formatMessage).filter(
                    c => c.accessor !== 'actions',
                ),
            ];
            const newColumns: VisibleColumn[] = metasColumns.map(c => ({
                key: c.accessor,
                label: c.Header,
                active: columnsNames.includes(c.accessor),
                meta: true,
                disabled:
                    activeOrders.indexOf(c.accessor) !== -1 ||
                    activeOrders.indexOf(`-${c.accessor}`) !== -1,
            }));

            if (possibleFields) {
                possibleFields?.forEach(field => {
                    const label = formatLabel(field);
                    newColumns.push({
                        key: field.name,
                        label,
                        active: columnsNames.includes(field.name),
                        disabled: false,
                    });
                });
            }
            return newColumns;
        },
        [activeOrders, formatMessage],
    );
    return getInstancesVisibleColumns;
};

export const getInstancesFilesList = (instances?: Instance[]): ShortFile[] => {
    const filesList: ShortFile[] = [];
    instances?.forEach(i => {
        if (i.files?.length > 0) {
            i.files?.forEach(path => {
                const file = {
                    itemId: i.id,
                    createdAt: i.created_at,
                    path: `${path}`,
                };
                filesList.push(file);
            });
        }
    });
    return filesList;
};

type SelectionAction = {
    icon: (
        // eslint-disable-next-line no-unused-vars
        newSelection: Selection<Instance>,
        // eslint-disable-next-line no-unused-vars
        resetSelection?: any,
    ) => ReactElement;
    label: string;
    disabled: boolean;
};

export const getSelectionActions = (
    formatMessage: IntlFormatMessage,
    filters: Record<string, string>,
    setForceRefresh: () => void,
    isUnDeleteAction = false,
    classes: Record<string, string>,
    currentUser: User,
): SelectionAction[] => {
    const label = formatMessage(
        isUnDeleteAction ? MESSAGES.unDeleteInstance : MESSAGES.deleteInstance,
    );

    const exportAction: SelectionAction = {
        icon: newSelection => (
            <ExportInstancesDialogComponent
                // @ts-ignore need to refactor this component to TS
                selection={newSelection}
                getFilters={() => filters}
                renderTrigger={openDialog => {
                    const iconDisabled = newSelection.selectCount === 0;
                    const iconProps = {
                        className: iconDisabled ? classes.iconDisabled : null,
                        onClick: !iconDisabled ? openDialog : () => null,
                        disabled: iconDisabled,
                    };
                    // @ts-ignore
                    return <CallMade {...iconProps} />;
                }}
            />
        ),
        label: formatMessage(MESSAGES.exportRequest),
        disabled: false,
    };

    const deleteAction: SelectionAction = {
        icon: (newSelection, resetSelection) => (
            <DeleteDialog
                selection={newSelection}
                filters={filters}
                setForceRefresh={setForceRefresh}
                resetSelection={resetSelection}
                isUnDeleteAction={isUnDeleteAction}
            />
        ),
        label,
        disabled: false,
    };

    const compareAction: SelectionAction = {
        icon: newSelection => {
            const isDisabled =
                newSelection.selectCount <= 1 || newSelection.selectAll;
            if (isDisabled) {
                return <CompareArrowsIcon color="disabled" />;
            }
            const instancesIds = newSelection.selectedItems
                .map(s => s.id)
                .join(',');
            return (
                <Link
                    style={{ color: 'inherit', display: 'flex' }}
                    to={`${baseUrls.compareInstances}/instanceIds/${instancesIds}`}
                >
                    <CompareArrowsIcon />
                </Link>
            );
        },
        label: formatMessage(MESSAGES.compare),
        disabled: false,
    };

    const actions: SelectionAction[] = [compareAction];
    if (userHasPermission(Permission.SUBMISSIONS_UPDATE, currentUser)) {
        actions.push(exportAction, deleteAction);
    }
    return actions;
};

const asBackendStatus = status => {
    if (status) {
        return status
            .split(',')
            .map(s => (s === 'ERROR' ? 'DUPLICATED' : s))
            .join(',');
    }
    return status;
};

export const getFilters = (
    params: Record<string, string>,
): Record<string, string> => {
    const allFilters = {
        withLocation: params.withLocation,
        orgUnitTypeId: params.orgUnitTypeId,
        deviceId: params.deviceId,
        startPeriod: params.startPeriod,
        endPeriod: params.endPeriod,
        status: asBackendStatus(params.status),
        deviceOwnershipId: params.deviceOwnershipId,
        search: params.search,
        orgUnitParentId: fetchLatestOrgUnitLevelId(params.levels),
        dateFrom: getFromDateString(params.dateFrom),
        dateTo: getToDateString(params.dateTo),
        showDeleted: params.showDeleted,
        form_ids: params.formIds,
        jsonContent: params.fieldsSearch,
        planningIds: params.planningIds,
        userIds: params.userIds,
        modificationDateFrom: getFromDateString(
            params.modificationDateFrom,
            false,
        ),
        modificationDateTo: getToDateString(params.modificationDateTo, false),
        sentDateFrom: getFromDateString(params.sentDateFrom, false),
        sentDateTo: getToDateString(params.sentDateTo, false),
    };
    const filters = {};
    Object.keys(allFilters).forEach(k => {
        if (allFilters[k]) {
            filters[k] = allFilters[k];
        }
    });
    return filters;
};

const defaultOrder = 'updated_at';

export const getExportUrl = (
    params: Record<string, string>,
    exportType = 'csv',
): string => {
    const baseUrl = `/api/instances`;
    const queryParams = { ...getFilters(params) };
    const urlParams = new URLSearchParams();
    Object.entries(queryParams).forEach(entry => {
        const [k, v] = entry;
        if (v) {
            urlParams.append(k, v);
        }
    });
    urlParams.append(exportType, 'true');
    const queryString = urlParams.toString();
    return `${baseUrl}/?${queryString}`;
};

export const getEndpointUrl = (
    params: Record<string, string>,
    toExport: boolean,
    exportType = 'csv',
    asSmallDict = false,
): string => {
    const urlParams = {
        limit: params.pageSize ? params.pageSize : 10,
        order: params.order ? params.order : `-${defaultOrder}`,
        page: params.page ? params.page : 1,
        asSmallDict: true,
        ...getFilters(params),
    };
    return getTableUrl(
        'instances',
        urlParams,
        toExport,
        exportType,
        false,
        asSmallDict,
    );
};

export const getFileUrl = (
    params: Record<string, string>,
    rowsPerPage: number,
    page: number,
): string => {
    const urlParams = {
        limit: rowsPerPage,
        // Django pagination start at 1 but Material UI at 0
        page: page + 1,
        ...getFilters(params),
    };
    return getTableUrl('instances/attachments', urlParams);
};
