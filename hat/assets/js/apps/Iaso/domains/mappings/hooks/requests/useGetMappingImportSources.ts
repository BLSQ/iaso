import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { MappingVersionRow } from '../../types';

const SOURCE_FIELDS =
    'id,form_version,mapping,question_mappings,derivate_settings,updated_at';

export const useGetMappingImportSources = (
    mappingType: string,
    enabled: boolean,
): UseQueryResult<MappingVersionRow[]> =>
    useSnackQuery({
        queryKey: ['mappingversions', 'importSources', mappingType],
        queryFn: () =>
            getRequest(
                `/api/mappingversions/?mappingTypes=${mappingType}&fields=${SOURCE_FIELDS}`,
            ).then(r => r.mapping_versions),
        options: { enabled: Boolean(mappingType) && enabled },
    });
