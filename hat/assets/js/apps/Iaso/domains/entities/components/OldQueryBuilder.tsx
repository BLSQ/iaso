import React, { FunctionComponent } from 'react';

import {
    QueryBuilderInput,
    useHumanReadableJsonLogic,
} from 'bluesquare-components';
import { Popper } from '../../forms/fields/components/Popper';
import { useGetAllFormDescriptors } from '../../forms/fields/hooks/useGetFormDescriptor';
import { useGetQueryBuilderListToReplace } from '../../forms/fields/hooks/useGetQueryBuilderListToReplace';
import { useGetQueryBuilderFieldsForAllForms } from '../../forms/fields/hooks/useGetQueryBuildersFields';
import { useGetAllPossibleFields } from '../../forms/hooks/useGetPossibleFields';
import { parseJson } from '../../instances/utils/jsonLogicParse';

import MESSAGES from '../messages';

type Props = {
    fieldsSearchJson: string;
    handleChange: (key: string, value?: string) => void;
};

export const OldQueryBuilder: FunctionComponent<Props> = ({
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
        <QueryBuilderInput
            label={MESSAGES.queryBuilder}
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
