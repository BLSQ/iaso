import { makeStyles } from '@mui/styles';
import React, { FunctionComponent } from 'react';
import { convertValueIfDate } from '../../../../components/Cells/DateTimeCell';
import { DuplicationAlgorithm } from '../types';

const getFields = (settings: any): string[] => {
    const { analyzis }: { analyzis: DuplicationAlgorithm[] } =
        settings.row.original;
    const allFields = analyzis.map(algo => algo.the_fields).flat();
    return [...new Set(allFields)];
};

const useStyles = makeStyles(theme => {
    return {
        diff: { color: theme.palette.error.main },
    };
});

type Props = {
    settings: any;
    entity: 'entity1' | 'entity2';
};

export const DuplicateCell: FunctionComponent<Props> = ({
    settings,
    entity,
}) => {
    const { entity1, entity2 } = settings.row.original;
    const fields = getFields(settings);
    const entityFields = fields.map((field: string) =>
        entity === 'entity1' ? entity1.json[field] : entity2.json[field],
    );
    const duplicateField = fields.map((field: string) =>
        entity === 'entity1' ? entity2.json[field] : entity1.json[field],
    );
    const classes = useStyles();
    return (
        <>
            {entityFields.map((field, index) => {
                const duplicate = duplicateField[index];
                const className = field !== duplicate ? classes.diff : '';
                return (
                    <p
                        className={className}
                        key={`${entity}-${field}-${index}`}
                    >
                        {convertValueIfDate(field)}
                    </p>
                );
            })}
        </>
    );
};
