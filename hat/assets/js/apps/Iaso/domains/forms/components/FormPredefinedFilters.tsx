import React, { FunctionComponent, useMemo } from 'react';
import { Box } from '@mui/material';
import { TableWithDeepLink } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from 'Iaso/constants/urls';
import { PredefinedFilterModal } from 'Iaso/domains/forms/components/PredefinedFilterModal';
import { useGetPredefinedFilters } from 'Iaso/domains/forms/hooks/useGetPredefinedFilters';
import { useSaveFormPredefinedFilter } from 'Iaso/domains/forms/hooks/useSaveFormPredefinedFilter';
import { useHumanReadableJsonLogicForForm } from 'Iaso/domains/workflows/hooks/useHumanReadableJsonLogicForForm';
import {
    useGetMainColumns,
    useGetActionColumns,
} from '../config/predefinedFilters';

import { FormParams } from '../types/forms';

export const defaultSorted = [{ id: 'updated_at', desc: false }];

type Props = {
    params: FormParams;
};

export const FormPredefinedFilters: FunctionComponent<Props> = ({ params }) => {
    const { data: predefinedFilters, isFetching: isFetchingPredefinedFilters } =
        useGetPredefinedFilters(params);

    const { mutateAsync: save, isLoading: isSaving } =
        useSaveFormPredefinedFilter();

    const getHumanReadableJsonLogic = useHumanReadableJsonLogicForForm(
        params.formId,
    );
    const mainColumns = useGetMainColumns(getHumanReadableJsonLogic);
    const actionColumns = useGetActionColumns(
        save,
        isSaving,
        params,
        predefinedFilters?.count ?? 0,
    );
    const columns = useMemo(
        () => [...mainColumns, ...actionColumns],
        [mainColumns, actionColumns],
    );
    return (
        <Box>
            <Box
                mb={2}
                justifyContent="flex-end"
                alignItems="center"
                display="flex"
            >
                <PredefinedFilterModal
                    iconProps={{}}
                    save={save}
                    isSaving={isSaving}
                    form_id={params.formId}
                />
            </Box>
            <TableWithDeepLink
                marginTop={false}
                data={predefinedFilters?.form_predefined_filters ?? []}
                pages={predefinedFilters?.pages ?? 1}
                defaultSorted={defaultSorted}
                columns={columns}
                count={predefinedFilters?.count ?? 0}
                baseUrl={baseUrls.formDetail}
                params={params}
                paramsPrefix="predefinedFilters"
                extraProps={{
                    loading: isFetchingPredefinedFilters,
                    getHumanReadableJsonLogic,
                }}
            />
        </Box>
    );
};
