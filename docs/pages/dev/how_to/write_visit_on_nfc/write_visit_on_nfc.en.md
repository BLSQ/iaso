# Forewords

In the context of CODA2, Iaso will have to write some forms’ information
on an NFC card. The NFC card’s size may vary in the future, but the
current size of the card is 8k. Yet, the card is currently split into
two partitions; one is used by CODA and the other by SCOPE. SCOPE has
6kB out of the 8, leaving 2kB to CODA.

Famoco provided the implementation for the CODA 1.5 application.

We know that the patient’s profile can take up to 500B, and the
subsequent visits can take up to 144B with a total of 8 visits maximum.

This gives us a total of 1652B if all slots are filled.

I assume that the remaining 396B (2048 - 1652) is the encryption
overhead.

> *Assuming Famoco is using an AES/CBC symmetric encryption with a salt
> of 256B and an IV (initialization vector) of 16B over the whole data,
> the assumption would hold.*

# Famoco’s split

In the documentation provided by Famoco, called *DESFireService_v1.0.1*,
they mention two types of writing:

1.  File “01”, which we’ll call the profile, is up to 500B

2.  File “02”, which we’ll call the visits, is of variable length based
    > on the type of card used.

The profile is marked as a binary file overridden on each writing.

The visits are marked as a cyclic record. Every time a visit is
recorded, it is added to the previous ones. If the max length is
reached, the oldest record is deleted to make room for the new one
(FIFO).

| ❓ It is yet to be defined if a model outside of Famoco should follow the same split and enforce the writing of one record at a time. |
|------------------------------------------------------------------------|

# NDEF Messages and NDEF Records

[<u>**N**FC</u> <u>**D**ata</u> <u>**E**xchange</u>
<u>**F**ormat</u>](https://developer.android.com/reference/android/nfc/tech/Ndef)
(or NDEF) is a lightweight binary format, used to encapsulate typed
data. It is specified by the NFC Forum, for transmission and storage
with NFC. However, it is transport agnostic.

The format defines Messages and Records:

-   An NDEF Record contains typed data, such as MIME-type media, a URI,
    > or a custom application payload.

-   An NDEF Message is a container for one or more NDEF Records.

# Why use NDEF?

As described in the [<u>Android
documentation</u>](https://developer.android.com/reference/android/nfc/tech/Ndef),
It is mandatory for all Android devices with NFC to correctly enumerate
Ndef on NFC Forum Tag Types 1-4, and implement all NDEF operations as
defined in said documentation.

Therefore, it guarantees that a perfectly written tag will be readable
by all Android devices with NFC.

Finally, the overhead of NDEF is existent but can be considered
negligible compared to the advantages it brings. Based on this
[<u>StackOverflow
answer</u>](https://stackoverflow.com/a/29606687/2637428), the overhead
is roughly 12 bytes:

-   NDEF Header byte: 1 byte

-   NDEF type length field: 1 byte

-   NDEF payload length field: 1-4 bytes

-   NDEF type name "iaso:p" (external type): 6 bytes

# Encryption

Famoco’s devices are relying on a [<u>**S**ecure</u> <u>**A**ccess</u>
<u>**M**odule</u>](https://en.wikipedia.org/wiki/Secure_access_module)
(or SAM) chip which encrypts and guarantees a secured shared secret
across the authorized devices.

Unfortunately, regular Android devices can't rely on such a chip.
Therefore, we must find a solution to encrypt the card's data in a way
only decipherable by another authorized device without an internet
connection.

Since all the authorized devices will need to be able to encrypt and
decrypt the data, there is no need to go with asymmetric encryption.

**The current standard for symmetric encryption is AES.**

## The overhead

As explained in this [<u>StackOverflow
answer</u>](https://stackoverflow.com/a/93463/2637428), AES doesn’t
expand data, but the padding will.

The maximum amount of padding is up to the padding algorithm.

In the case of
[<u>PKCS7Padding</u>](https://en.wikipedia.org/wiki/Padding_%28cryptography%29#PKCS#5_and_PKCS#7),
it should be up to 16 bytes as defined in the
[<u>RFC3602</u>](https://www.ietf.org/rfc/rfc3602.txt).

On top of that, it’s good practice to
[<u>salt</u>](https://en.wikipedia.org/wiki/Salt_(cryptography)) the
password to make the deciphering even more complex, avoid rainbow tables
attacks, and avoid being able to compare two identical records (which is
more likely to happen with small forms).

AES also comes with the concept of [<u>**I**nitialization</u>
<u>**V**ector</u>](https://en.wikipedia.org/wiki/Initialization_vector)
(or IV) randomly generated on each encryption.

The salt and the IV will be communicated in clear text alongside the
encrypted data to be able to decrypt it. Therefore, they will add up to
the number of bytes written on the card.

| 🔐 As advised by the [<u>**N**ational</u> <u>**I**nstitute of</u> <u>**S**tandards and</u> <u>**T**echnology</u>](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf) (NIST), the length of the randomly-generated portion of the **salt** **shall be at least [<u>128 bits</u>](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf)** (16 bytes)**.** In the current PoC implementation, it’s 256 bytes. |
|------------------------------------------------------------------------|

| 🔐 AES requires an IV size of 16 bytes |
|----------------------------------------|

The total overhead is therefore of the size of the salt (256B), the size
of the IV (16B), and the padding (up to 16B), which sums up to 288B but
could be lowered to 48B if we reduce the salt to 16B for lesser
security.

## How the data is split

The overhead discussed previously is computed per encryption; if we
encrypt all the data at once, the overhead is of that amount. If we
encrypt the profile and the visits separately, the overhead is
multiplied by two. The overhead is much higher if we encrypt the profile
and each visit individually.

| 🔐 I don’t have sufficient knowledge to tell if there is any security benefit in one or the other approach. Yet, based on the size of the available space on the card, I assume we should encrypt all the data at once or encrypt the profile and the visits separately but not all the visits apiece. |
|------------------------------------------------------------------------|

# Sharing the NFC password securely

Every security measure is as strong as its weakest link. The whole
encryption mechanism is rendered useless if the password is too weak,
easily guessable, or easily accessible.

Therefore, we need to find a good way to share the password while
considering the complexity for the end user to obtain it.

| 😈 Keep in mind that nothing is 100% secure. All the solutions we could come up with have flaws, even the SAM chip used by Famoco. Yet, we can only make it harder and harder for someone to retrieve the key to the point that they either can’t retrieve it (missing skills or hardware) or don’t find that it is worth their while. |
|------------------------------------------------------------------------|

## Embedded inside the APK

The easiest way to share a password across authorized devices is to
embed it directly into the APK (an APK is a file containing the code and
resources of an application that an Android device can interpret to
install it).

Yet, this solution is only viable if, **and only if**, the APK is
distributed via a **M**obile **D**evice **M**anagement (or MDM) and that
the MDM can securely prevent people from retrieving the APK from the
device.

If the APK is distributed via the Play Store (or any other means that is
publicly available or that allow retrieving the APK), the password must
be considered compromised and rendered useless.

*This solution is similar to what Famoco is doing since, in their case,
the password is embedded and secured inside the SAM chip.*

## Over the network

This solution is easy for the end user, but more vulnerable as anyone
can make a network request.

The client should make an authorized (given a valid token previously
retrieved with valid credentials) request to a specific endpoint.

The endpoint would receive a public key (from an asymmetric encryption
scheme like RSA) of a hardware-backed key pair as described in
[<u>Android’s
documentation</u>](https://developer.android.com/training/articles/security-key-attestation).

The backend would be able to verify the validity of the key and its
certificate chain, pointing to a Google valid certificate, and
containing the correct application ID and signature.

The password would then be encrypted by the backend with the public key
and communicated back to the phone. The application should then be able
to decrypt the password and store it securely.

This solution involves that only the application can decrypt the given
password.

| 🔑 This is the investigated solution at the moment of this writing but we are unsure how secure this would be on a rooted Android device. |
|------------------------------------------------------------------------|

This solution involves security measures that can be hard for attackers
to obtain:

1.  Valid credentials

2.  A compromised phone with the application on it.

3.  A way to compromise the device in a way it is not detected by
    > Android.

## Over a physical device

If the password is stored inside a physical device (like a USB key, a
specific phone application, etc.) that is provided in limited quantities
to trusted members of the organization, it can be shared through
physical contact between the device to authorize and the trusted member
with the physical device.

The password is then securely stored on the authorized device for later
use.

This solution is secure but could be cumbersome. For example, if there
are many devices to authorize, it can take a long time to transfer the
password on each device. There could also be an issue if the devices are
spread across the country, and the trusted members must go to each
location to authorize the devices.

## A mix of the above solutions

The solutions provided above are not exhaustive and can also be mixed.
For example, we could consider storing the password on a physical device
to be encrypted with a key that needs to be retrieved via an authorized
network request.

The more barrier we put in recovering the key, the more secure it is.
Yet, it also makes the logistics for genuine authorized devices more
complex.
