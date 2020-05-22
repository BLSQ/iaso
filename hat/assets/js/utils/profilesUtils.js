const combineName = (first, last) => {
    if (!first && !last) {
        return '?';
    }
    return `${first || ''} ${last || ''}`.trim();
};

const getDisplayName = profile => ((profile.user__first_name || profile.user__last_name) ? (
    `${profile.user__username} (${combineName(profile.user__first_name, profile.user__last_name)})`
) : profile.user__username);

export const getTesterDisplayName = tester => (
    tester !== null
        ? `${tester.userName}${(tester.firstName || tester.lastName) ? ` (${combineName(tester.firstName, tester.lastName)})` : ''}`
        : '-');

export default getDisplayName;
