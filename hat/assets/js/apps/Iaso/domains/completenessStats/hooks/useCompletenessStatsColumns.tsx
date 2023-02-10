import React, { useMemo } from 'react';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    IconButton as IconButtonComponent,
} from 'bluesquare-components';
import { useDispatch } from 'react-redux';
import { cloneDeep } from 'lodash';
import AccountTreeIcon from '@material-ui/icons/AccountTree';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import Tooltip from '@material-ui/core/Tooltip';
import { redirectTo } from '../../../routing/actions';
import MESSAGES from '../messages';
import { baseUrls } from '../../../constants/urls';

const baseUrl = `${baseUrls.completenessStats}`;

export const useCompletenessStatsColumns = (params: any) => {
    const { formatMessage } = useSafeIntl();
    const redirectionParams: Record<string, any> = useMemo(() => {
        const clonedParams = cloneDeep(params);
        delete clonedParams.parentId;
        return clonedParams;
    }, [params]);
    const dispatch = useDispatch();
    return useMemo(
        () => [
            {
                Header: formatMessage(MESSAGES.orgUnit),
                id: 'name',
                accessor: 'name',
                sortable: true,
                Cell: settings => {
                    return (
                        <span>
                            {settings.row.original.org_unit?.name ?? '--'}
                        </span>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.orgUnitType),
                id: 'org_unit_type__name',
                accessor: 'org_unit_type__name',
                sortable: true,
                Cell: settings => {
                    return (
                        <span>
                            {settings.row.original.org_unit_type?.name ?? '--'}
                        </span>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.parent),
                id: 'parent_org_unit__name',
                accessor: 'parent_org_unit__name',
                sortable: false,
                Cell: settings => (
                    <span>
                        {settings.row.original.parent_org_unit?.[0].name ??
                            '--'}
                    </span>
                ),
            },
            {
                Header: formatMessage(MESSAGES.form),
                id: 'form__name',
                accessor: 'form__name',
                sortable: false,
                Cell: settings => (
                    <span>{settings.row.original.form?.name ?? '--'}</span>
                ),
            },
            {
                Header: formatMessage(MESSAGES.formsFilledDirect),
                id: 'forms_filled_direct',
                accessor: 'forms_filled_direct',
                sortable: false,
                Cell: settings => (
                    <span>
                        {settings.row.original.forms_filled_direct ?? '--'}/
                        {settings.row.original.forms_to_fill_direct ?? '--'}
                        {settings.row.original
                            .has_multiple_direct_submissions && (
                            <Tooltip
                                title={formatMessage(
                                    MESSAGES.orgUnitHasMultipleSubmissions,
                                )}
                            >
                                <AddCircleOutlineIcon fontSize="small" />
                            </Tooltip>
                        )}
                    </span>
                ),
            },
            {
                Header: formatMessage(MESSAGES.completenessDirect),
                id: 'completeness_ratio_direct',
                accessor: 'completeness_ratio_direct',
                sortable: false,
            },
            {
                Header: formatMessage(MESSAGES.formsFilledWithDescendants),
                id: 'forms_filled',
                accessor: 'forms_filled',
                sortable: false,
                Cell: settings => (
                    <span>
                        {settings.row.original.forms_filled ?? '--'}/
                        {settings.row.original.forms_to_fill ?? '--'}
                    </span>
                ),
            },
            {
                Header: formatMessage(MESSAGES.completenessWithDescendants),
                id: 'completeness_ratio',
                accessor: 'completeness_ratio',
                sortable: false,
            },
            {
                Header: formatMessage(MESSAGES.actions),
                id: 'bleh',
                accessor: 'blej',
                sortable: false,
                Cell: settings => {
                    return (
                        <>
                            <IconButtonComponent
                                onClick={() => {
                                    dispatch(
                                        redirectTo(baseUrl, {
                                            ...redirectionParams,
                                            parentId:
                                                settings.row.original.org_unit
                                                    ?.id,
                                        }),
                                    );
                                }}
                                tooltipMessage={MESSAGES.seeChildren}
                                overrideIcon={AccountTreeIcon}
                            />
                        </>
                    );
                },
            },
        ],
        [dispatch, formatMessage, redirectionParams],
    );
};
