// Open every external link (anywhere on the page - content, nav, header) in a
// new tab, instead of navigating away from the docs. Internal links (relative
// paths, or absolute links to this same host) are left alone.
document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll('a[href^="http://"], a[href^="https://"]').forEach(function (link) {
        if (link.hostname && link.hostname !== window.location.hostname) {
            link.setAttribute("target", "_blank");
            link.setAttribute("rel", "noopener noreferrer");
        }
    });
});
