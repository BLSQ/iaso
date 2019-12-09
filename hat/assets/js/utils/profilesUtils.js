const getDisplayName = profile => ((profile.user__first_name || profile.user__last_name) ? (
    `${profile.user__username}
        (${profile.user__first_name ? `${profile.user__first_name}` : ''}
            ${profile.user__first_name && profile.user__last_name ? ' ' : ''}
            ${profile.user__last_name ? `${profile.user__last_name}` : ''}) `
) : profile.user__username);

export default getDisplayName;
