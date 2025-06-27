import React, { FunctionComponent } from 'react';

import { useHumanReadableJsonLogic } from 'bluesquare-components';
import { Popper } from '../../../forms/fields/components/Popper';
import { useGetAllFormDescriptors } from '../../../forms/fields/hooks/useGetFormDescriptor';
import { useGetQueryBuilderListToReplace } from '../../../forms/fields/hooks/useGetQueryBuilderListToReplace';
import { useGetQueryBuilderFieldsForAllForms } from '../../../forms/fields/hooks/useGetQueryBuildersFields';
import { useGetAllPossibleFields } from '../../../forms/hooks/useGetPossibleFields';
import { parseJson } from '../../../instances/utils/jsonLogicParse';
import MESSAGES from '../../messages';
import { DialogBuilder } from './DialogBuilder';

type Props = {
    fieldsSearchJson: string;
    handleChange: (key: string, value?: string) => void;
};

export const EntitiesQueryBuilder: FunctionComponent<Props> = ({
    fieldsSearchJson,
    handleChange,
}) => {
    // Load QueryBuilder resources
    const { allPossibleFields } = useGetAllPossibleFields();
    const { data: formDescriptors } = useGetAllFormDescriptors();
    const fields = useGetQueryBuilderFieldsForAllForms(
        formDescriptors,
        allPossibleFields,
    );
    const queryBuilderListToReplace = useGetQueryBuilderListToReplace();
    const getHumanReadableJsonLogic = useHumanReadableJsonLogic(
        fields,
        queryBuilderListToReplace,
    );

    const handleChangeQueryBuilder = value => {
        if (value) {
            const parsedValue = parseJson({ value, fields });
            handleChange('fieldsSearch', JSON.stringify(parsedValue));
        } else {
            handleChange('fieldsSearch', undefined);
        }
    };

    return (
        <DialogBuilder
            onChange={handleChangeQueryBuilder}
            initialLogic={fieldsSearchJson}
            fields={fields}
            iconProps={{
                label: MESSAGES.queryBuilder,
                value: fieldsSearchJson
                    ? (getHumanReadableJsonLogic(fieldsSearchJson) as string)
                    : '',
                onClear: () => handleChange('fieldsSearch', undefined),
            }}
            InfoPopper={<Popper />}
        />
    );
};
