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
        },
    )
