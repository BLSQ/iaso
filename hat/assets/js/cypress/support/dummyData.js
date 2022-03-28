export const makePaginatedResponse = ({
    hasPrevious,
    hasNext,
    count,
    page,
    pages,
    limit,
    dataKey,
    data,
}) => {
    return {
        hasPrevious,
        hasNext,
        count,
        page,
        pages,
        limit,
        [dataKey]: data,
    };
};

export const pageOneTemplate = {
    hasPrevious: false,
    hasNext: true,
    page: 1,
    pages: 2,
    limit: 10,
    count: 15,
};
export const pageTwoTemplate = {
    hasPrevious: true,
    hasNext: false,
    page: 2,
    pages: 2,
    limit: 10,
    count: 15,
};

const CREATED_AT = '2021-10-08T16:22:44.098525Z';
const UPDATED_AT = '2021-10-09T17:15:37.098551Z';

export const makeSourceVersion = ({
    versionId,
    versionNumber,
    dataSourceId,
    dataSourceName,
    description = '',
    createdAt = CREATED_AT,
    updatedAt = UPDATED_AT,
    isDefault = false,
    orgUnitsCount = 100,
}) => {
    return {
        id: versionId,
        number: versionNumber,
        data_source: dataSourceId,
        data_source_name: dataSourceName,
        created_at: createdAt,
        updated_at: updatedAt,
        org_units_count: orgUnitsCount,
        is_default: isDefault,
        description,
    };
};

export const makeSourceVersionsList = ({
    dataSourceId,
    dataSourceName,
    amount,
    versionReferenceId,
    defaultVersionIndex,
}) => {
    const versions = [];
    if (amount) {
        for (let i = 0; i <= amount; i += 1) {
            const version = makeSourceVersion({
                dataSourceId,
                dataSourceName,
                versionId: versionReferenceId + i + 1,
                versionNumber: i,
            });
            if (defaultVersionIndex === i) {
                version.is_default = true;
            }
            versions.push(version);
        }
    }
    return { versions };
};

export const makeSourceVersionsFromSeed = datasourceSeed => {
    const versions = [];
    const totalVersionsAmount = datasourceSeed.reduce(
        (total = 0, current) => current?.versions ?? 0 + total,
    );
    let currentVersion = totalVersionsAmount;
    datasourceSeed.forEach(seed => {
        const versionsForSeed = makeSourceVersionsList({
            dataSourceId: seed.id,
            dataSourceName: seed.name,
            amount: seed.versions,
            defaultVersionIndex: seed.defaultVersion,
            versionReferenceId: currentVersion - totalVersionsAmount,
        });
        currentVersion += seed.versions + 1;
        versions.push(versionsForSeed.versions);
    });
    return { versions: versions.flat() };
};

export const makeDataSource = ({
    dataSourceId,
    dataSourceName,
    description = '',
    projects,
    versions,
    createdAt = CREATED_AT,
    updatedAt = UPDATED_AT,
    url = null,
    defaultVersion = null,
    credentials = null,
}) => {
    return {
        id: dataSourceId,
        name: dataSourceName,
        description,
        url,
        created_at: createdAt,
        updated_at: updatedAt,
        projects,
        versions,
        default_version: defaultVersion,
        credentials,
    };
};

export const makeProject = ({ id, name }) => {
    return {
        id,
        name,
        app_id: 'test.bluesquarehub.iaso',
    };
};

export const makeProjects = (amount, rootName = 'Project') => {
    const projects = [];
    for (let i = 0; i <= amount; i += 1) {
        const project = makeProject({ id: i, name: `${rootName}${i}` });
        projects.push(project);
    }
    return { projects };
};

export const makeCredentials = ({ id, name = '', login = '', url = '' }) => {
    return {
        id,
        name,
        login,
        url,
        is_valid: login && url && name,
    };
};
