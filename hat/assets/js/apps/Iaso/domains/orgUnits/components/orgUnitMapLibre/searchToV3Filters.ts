import { getFromDateString, getToDateString } from '../../../../utils/dates';
import { Search } from '../../types/search';
import { OrgUnitTilesFilters } from './orgUnitTiles';

/** `DD-MM-YYYY`, the format of the dates of the search params */
const URL_DATE = /^(\d{2})-(\d{2})-(\d{4})$/;

/** Keys of a search that aren't filters */
const NOT_FILTERS = new Set(['color', 'isAdded', 'locationLimit']);

export type V3Search = {
    filters: OrgUnitTilesFilters;
    /** search keys v3 can't express: the map shows more org units than the list for them */
    unsupported: string[];
};

const list = (value?: string | number): string | undefined =>
    value === undefined || value === '' ? undefined : String(value);

/** A `DD-MM-YYYY` search date as `YYYY-MM-DD` (v3 date filters) */
const toApiDate = (value: string): string | undefined => {
    const match = URL_DATE.exec(value);
    return match ? `${match[3]}-${match[2]}-${match[1]}` : undefined;
};

/**
 * A datetime bound for v3: the start or end of the day of a `DD-MM-YYYY` search date. `useGetApiParams`
 * converts the dates of the searches in place, so a date may already be an API datetime: passed on as is.
 */
const toApiDateTime = (value: string, bound: 'from' | 'to'): string =>
    URL_DATE.test(value)
        ? ((bound === 'from'
              ? getFromDateString(value)
              : getToDateString(value)) as string)
        : value;

/**
 * The `/api/v3/orgunits/` filters of an org unit search: the same org units as `/api/orgunits/?searches=`
 * (`build_org_units_queryset`), so tiles can draw a search. Keys it can't express are listed in `unsupported`
 * rather than dropped silently.
 */
export const searchToV3Filters = (search: Search): V3Search => {
    const filters: OrgUnitTilesFilters = {};
    const unsupported: string[] = [];
    const handled = new Set<string>(NOT_FILTERS);
    const values = search as Record<string, string | undefined>;
    const take = (key: string): string | undefined => {
        handled.add(key);
        return values[key];
    };

    filters.search = list(take('search'));
    filters.project_id = list(take('project'));
    filters.org_unit_type_id__in = list(take('orgUnitTypeId'));
    filters.group_id__in = list(take('group'));
    filters.depth = list(take('depth'));

    const version = list(take('version'));
    const source = list(take('source'));
    if (version) {
        filters.version_id = version;
    } else if (source) {
        // the search takes the default version of the source: v3 has no such filter, `source_id` is all versions
        filters.source_id = source;
        unsupported.push('source');
    }

    // the search defaults to valid org units
    const validationStatus = take('validation_status') ?? 'VALID';
    if (validationStatus !== 'all') {
        filters.validation_status__in = validationStatus;
    }

    // `levels` is the org unit picked in the filters, `orgUnitParentId` its copy by `useGetApiParams`
    const parent = list(take('orgUnitParentId')) ?? list(take('levels'));
    take('levels');
    if (parent) {
        filters.ancestor_id__or_self = parent;
    }

    switch (take('geography')) {
        case 'location':
            filters.has_location = true;
            break;
        case 'shape':
            filters.has_shape = true;
            break;
        case 'none':
            filters.has_location = false;
            filters.has_shape = false;
            break;
        default:
            // 'any': every org unit on the map is located anyway
            break;
    }

    const hasInstances = take('hasInstances');
    if (hasInstances === 'true' || hasInstances === 'false') {
        filters.has_instances = hasInstances === 'true';
    } else if (hasInstances) {
        unsupported.push('hasInstances');
    }
    const dateFrom = take('dateFrom');
    const dateTo = take('dateTo');
    if (dateFrom) {
        filters.instance__created_at__gte = toApiDateTime(dateFrom, 'from');
    }
    if (dateTo) {
        filters.instance__created_at__lte = toApiDateTime(dateTo, 'to');
    }

    // the search matches these dates exactly
    (['opening_date', 'closed_date'] as const).forEach(key => {
        const value = take(key);
        const date = value && toApiDate(value);
        if (date) {
            filters[`${key}__gte`] = date;
            filters[`${key}__lte`] = date;
        } else if (value) {
            unsupported.push(key);
        }
    });

    Object.keys(values).forEach(key => {
        if (!handled.has(key) && values[key] !== undefined) {
            unsupported.push(key);
        }
    });
    Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
            delete filters[key];
        }
    });
    return { filters, unsupported };
};
