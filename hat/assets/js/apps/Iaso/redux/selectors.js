const selectCurrentUser = state => state.users.current;

const selectDefaultSource = state =>
    selectCurrentUser(state)?.account?.default_version?.data_source;
export const selectDefaultVersionId = state =>
    selectCurrentUser(state)?.account?.default_version?.id?.toString();
