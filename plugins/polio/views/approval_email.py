from django.shortcuts import render


def test_email_render(request):
    return render(
        request,
        "validation_email.html",
        {
            "validation_link": "https://www.lesoir.be",
            "rejection_link": "https://www.theguardian.com",
            "campaign": "Test campaign",
            "LANGUAGE_CODE": "en",
            "author_first_name": "Johnny",
            "author_last_name": "Rotten",
            "comment": "I am Johnny Rotten and I approve this budget",
            "team": "Sex Pistols",
            "sender": "iaso-staging.bluesquare.org",
            "event_type": "submission",
        },
    )
