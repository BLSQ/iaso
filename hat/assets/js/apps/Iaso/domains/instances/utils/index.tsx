import React, {
    FunctionComponent,
    ReactElement,
    useCallback,
    useMemo,
} from 'react';
import CallMade from '@mui/icons-material/CallMade';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { Tooltip } from '@mui/material';
import {
    Column,
    LinkWithLocation,
    RenderCell,
    Setting,
    getTableUrl,
    truncateText,
    useSafeIntl,
} from 'bluesquare-components';
import moment from 'moment';

import { baseUrls } from '../../../constants/urls';
import { getCookie } from '../../../utils/cookies';

import {
    apiDateFormat,
    apiDateTimeFormat,
    getFromDateString,
    getToDateString,
} from '../../../utils/dates';
import * as Permission from '../../../utils/permissions';
import { useCurrentUser } from '../../../utils/usersUtils';
import { Form, PossibleField } from '../../forms/types/forms';
import { Selection } from '../../orgUnits/types/selection';
import { getLatestOrgUnitLevelId } from '../../orgUnits/utils';
import { userHasOneOfPermissions, userHasPermission } from '../../users/utils';
import ActionTableColumnComponent from '../components/ActionTableColumnComponent';

import { InstanceMetasField } from '../components/ColumnSelect';
import DeleteDialog from '../components/DeleteInstanceDialog';
import ExportInstancesDialogComponent from '../components/ExportInstancesDialogComponent';

import { LinkReferenceInstancesModalComponent } from '../components/InstanceReferenceSubmission/LinkReferenceInstancesComponent';
import { PushGpsModalComponent } from '../components/PushInstanceGps/PushGpsDialogComponent';
import instancesTableColumns from '../config';
import { INSTANCE_METAS_FIELDS } from '../constants';
import MESSAGES from '../messages';
import { Instance, ShortFile } from '../types/instance';
import { VisibleColumn } from '../types/visibleColumns';

const NO_VALUE = '/';
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
    type: string;
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
    if (field.type === 'calculate') return `Σ ${field.label}`;
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

export const useInstancesColumns = (
    // eslint-disable-next-line default-param-last
    getActionCell: RenderCell = settings => (
        <ActionTableColumnComponent settings={settings} />
    ),
    visibleColumns: VisibleColumn[],
): Column[] => {
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();
    const metasColumns = useMemo(
        () => [...instancesTableColumns(formatMessage)],
        [formatMessage],
    );
    const InstancesColumns = useMemo(() => {
        let tableColumns: Column[] = [];
        metasColumns.forEach(c => {
            const metaColumn = visibleColumns.find(vc => vc.key === c.accessor);
            if ((metaColumn && metaColumn.active) || c.accessor === 'actions') {
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
            userHasPermission(Permission.REGISTRY_WRITE, currentUser) ||
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
    }, [
        currentUser,
        formatMessage,
        getActionCell,
        metasColumns,
        visibleColumns,
    ]);
    return InstancesColumns;
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
    Cell?: (s: any) => ReactElement;
    align?: 'left' | 'center';
};

export const useGetInstancesVisibleColumns = ({
    order,
    defaultOrder,
}: Props): ((
    columns?: string,
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

const getDefaultCols = (
    formIds: string[],
    labelKeys: string[],
    instanceMetasFields: InstanceMetasField[],
    periodType?: string,
): string => {
    let newCols: string[] = instanceMetasFields
        .filter(f => Boolean(f.tableOrder) && f.active)
        .map(f => f.accessor || f.key);
    if (formIds && formIds.length === 1) {
        newCols = newCols.filter(c => c !== 'form__name');
        if (periodType === null) {
            newCols = newCols.filter(c => c !== 'period');
        }
    }
    let newColsString = newCols.join(',');
    if (labelKeys.length > 0) {
        newColsString = `${newColsString},${labelKeys.join(',')}`;
    }
    return newColsString;
};

type UseInstanceVisibleColumnsArgs = {
    formDetails: Form;
    formIds: string[];
    instanceMetasFields?: InstanceMetasField[];
    labelKeys: string[];
    columns?: string;
    periodType?: string;
    possibleFields?: PossibleField[];
    order?: string;
    defaultOrder: string;
};
export const useInstanceVisibleColumns = ({
    formDetails,
    formIds,
    instanceMetasFields,
    labelKeys,
    columns,
    periodType,
    possibleFields,
    order,
    defaultOrder,
}: UseInstanceVisibleColumnsArgs): VisibleColumn[] => {
    const getVisibleColumns = useGetInstancesVisibleColumns({
        order,
        defaultOrder,
    });
    return useMemo(() => {
        const newColsString: string =
            columns ||
            getDefaultCols(
                formIds,
                labelKeys,
                // @ts-ignore
                instanceMetasFields || INSTANCE_METAS_FIELDS,
                periodType,
            );
        let newCols: VisibleColumn[] = [];
        // single form
        if (formIds?.length === 1) {
            // if detail loaded
            if (formDetails) {
                newCols = getVisibleColumns(newColsString, possibleFields);
            }
            // multi forms
        } else {
            newCols = getVisibleColumns(newColsString);
        }
        return newCols;
    }, [
        columns,
        formDetails,
        formIds,
        getVisibleColumns,
        instanceMetasFields,
        labelKeys,
        periodType,
        possibleFields,
    ]);
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
        newSelection: Selection<Instance>,
        resetSelection?: any,
    ) => ReactElement;
    label: string;
    disabled: boolean;
};

export const useSelectionActions = (
    filters: Record<string, string>,
    setForceRefresh: () => void,
    // eslint-disable-next-line default-param-last
    isUnDeleteAction = false,
    classes: Record<string, string>,
): SelectionAction[] => {
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();
    const label = formatMessage(
        isUnDeleteAction ? MESSAGES.unDeleteInstance : MESSAGES.deleteInstance,
    );

    return useMemo(() => {
        const assignReferenceSubmissions: SelectionAction = {
            icon: newSelection => {
                return (
                    <LinkReferenceInstancesModalComponent
                        selection={newSelection}
                        iconProps={{
                            iconDisabled: newSelection.selectCount === 0,
                        }}
                        filters={filters}
                    />
                );
            },

            label: formatMessage(
                MESSAGES.linkUnlinkReferenceSubmissionsToOrgUnits,
            ),
            disabled: false,
        };
        const pushGpsAction: SelectionAction = {
            icon: newSelection => (
                <PushGpsModalComponent
                    selection={newSelection}
                    iconProps={{ iconDisabled: newSelection.selectCount === 0 }}
                    filters={filters}
                />
            ),
            label: formatMessage(MESSAGES.pushGpsToOrgUnits),
            disabled: false,
        };
        const exportAction: SelectionAction = {
            icon: newSelection => (
                <ExportInstancesDialogComponent
                    // @ts-ignore need to refactor this component to TS
                    selection={newSelection}
                    getFilters={() => filters}
                    renderTrigger={openDialog => {
                        const iconDisabled = newSelection.selectCount === 0;
                        const iconProps = {
                            className: iconDisabled
                                ? classes.iconDisabled
                                : null,
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
                    <LinkWithLocation
                        style={{ color: 'inherit', display: 'flex' }}
                        to={`/${baseUrls.compareInstances}/instanceIds/${instancesIds}`}
                    >
                        <CompareArrowsIcon />
                    </LinkWithLocation>
                );
            },
            label: formatMessage(MESSAGES.compare),
            disabled: false,
        };

        const actions: SelectionAction[] = [compareAction];
        if (userHasPermission(Permission.SUBMISSIONS_UPDATE, currentUser)) {
            actions.push(
                exportAction,
                deleteAction,
                pushGpsAction,
                assignReferenceSubmissions,
            );
        }
        return actions;
    }, [
        classes.iconDisabled,
        currentUser,
        filters,
        formatMessage,
        isUnDeleteAction,
        label,
        setForceRefresh,
    ]);
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
        orgUnitParentId: getLatestOrgUnitLevelId(params.levels),
        dateFrom: getFromDateString(params.dateFrom, false),
        dateTo: getToDateString(params.dateTo, false),
        showDeleted: params.showDeleted,
        form_ids: params.formIds,
        jsonContent: params.fieldsSearch,
        planningIds: params.planningIds,
        project_ids: params.projectIds,
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

export const useGetFilters = (
    params: Record<string, string>,
): Record<string, string> => {
    return useMemo(() => {
        return getFilters(params);
    }, [params]);
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
