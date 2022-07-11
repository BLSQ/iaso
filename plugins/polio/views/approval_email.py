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
            "approver_first_name": "Johnny",
            "approver_last_name": "Rotten",
            "comment": "I am Johnny Rotten and I approve this budget",
            "team": "Sex Pistols",
            "sender": "iaso-staging.bluesquare.org",
        },
    )
