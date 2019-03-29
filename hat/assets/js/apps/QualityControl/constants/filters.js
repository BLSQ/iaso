import { testTypeImage, testTypeVideo, users } from '../../../utils/constants/filters';

const filtersTypes = () => (
    [
        testTypeImage(),
        testTypeVideo(),
    ]
);

const filtersUsers = usersList => (
    [
        users(usersList),
    ]
);

export {
    filtersTypes,
    filtersUsers,
};
