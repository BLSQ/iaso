import React, { FunctionComponent, useState } from 'react';
import { useFormikContext } from 'formik';
import { useSkipEffectOnMount, useDebounce } from 'bluesquare-components';
import { ScopeField } from '../../Scope/ScopeField';
import { CampaignFormValues, Round } from '../../../../constants/types';
import { useIsPolioCampaign } from '../../hooks/useIsPolioCampaignCheck';
import { FilteredDistricts } from '../../Scope/Scopes/types';
import { useFilteredDistricts } from '../../Scope/Scopes/utils';
import { useGetSubActivityShapes } from '../hooks/api/subActivityShapes';
import { SubActivityFormValues } from '../types';

type Props = { campaign: CampaignFormValues; round?: Round };

export const SubActivityScopeField: FunctionComponent<Props> = ({
    campaign,
    round,
}) => {
    const { values: subActivity } = useFormikContext<SubActivityFormValues>();
    const isPolio = useIsPolioCampaign(campaign);
    const [searchScope, setSearchScope] = useState<boolean>(true);
    const [page, setPage] = useState<number>(0);
    const [search, setSearch] = useState('');
    const [debouncedSearch] = useDebounce(search, 500);

    const {
        districtShapes,
        regionShapes,
        isFetchingDistricts,
        isFetchingRegions,
    } = useGetSubActivityShapes(campaign, round);

    const filteredDistricts: FilteredDistricts[] | undefined =
        useFilteredDistricts({
            scopes: subActivity.scopes,
            regionShapes,
            districtShapes,
            isPolio,
            search: debouncedSearch,
            searchScope,
        });

    // Uncomment to enable restriction of available vaccines based on round vaccines
    // const availableVaccines = useMemo(() => {
    //     const subActivityVaccines = round?.scopes?.map(scope => scope.vaccine);
    //     if (!subActivityVaccines) {
    //         return undefined;
    //     }
    //     const vaccines = polioVaccines.filter(vaccine =>
    //         subActivityVaccines.includes(vaccine.value),
    //     );
    //     if (vaccines.length > 0) {
    //         return vaccines;
    //     }
    //     return undefined;
    // }, [round?.scopes]);

    useSkipEffectOnMount(() => {
        setPage(0);
    }, [filteredDistricts]);

    return (
        <ScopeField
            name="scopes"
            searchScope={searchScope}
            setSearchScope={setSearchScope}
            page={page}
            setPage={setPage}
            search={search}
            setSearch={setSearch}
            districtShapes={districtShapes}
            regionShapes={regionShapes}
            isFetchingDistricts={isFetchingDistricts}
            isFetchingRegions={isFetchingRegions}
            filteredDistricts={filteredDistricts}
            campaign={campaign}
            // availableVaccines={availableVaccines}
            searchInputWithMargin={false}
        />
    );
};
