# Configurer une campagne de distribution de MILDA avec l'IA

Avec les données de démonstration, la configuration prend environ 10 minutes. Vous pouvez ensuite soumettre des données de test pour juger de l'aspect et du fonctionnement.

## À savoir avant de commencer

!!! tip "Vous utilisez un autre assistant IA ?"
    Ce guide a été testé avec Claude et ChatGPT. Si vous rencontrez des difficultés avec un
    autre assistant IA, vos retours nous intéressent :
    [contactez-nous à products@bluesquarehub.com](mailto:products@bluesquarehub.com).

---

## Étape 1 : Créer votre compte de démonstration IASO

Créez un compte de démonstration IASO sur [openiaso.com/pricing](https://www.openiaso.com/pricing/).
L'utilisateur principal de ce compte a toutes les permissions dont le kit a besoin :
utilisez ses identifiants pendant tout le test.

## Étape 2 : Télécharger le kit

Téléchargez le kit de campagne IASO, un fichier zip d'instructions pour l'assistant IA :

- **[Kit de campagne en français](./setup_bednet_campaign_with_ai_attachments/iaso-campaign-setup-fr.zip)** (zip, 6,1 Mo)

## Étape 3 : Donner au kit l'accès à votre compte IASO

Le kit a besoin d'une **clé d'accès** (un « token ») pour travailler dans votre compte IASO
en votre nom.

1. Décompressez le fichier ZIP.
2. Ouvrez ce lien et connectez-vous avec votre utilisateur principal :
   **[https://app.openiaso.com/login/?next=/api/apitoken/](https://app.openiaso.com/login/?next=/api/apitoken/)**
3. La page affiche une ligne comme `{"token": "eyJ0eXAiOiJKV1Qi…"}`. Copiez le long texte
   entre la deuxième paire de guillemets : c'est votre clé d'accès.
4. Dans le dossier du kit, ouvrez le fichier `iaso_config.txt` avec un éditeur de texte
   (Bloc-notes, TextEdit…).
5. Vérifiez que la ligne `IASO_URL=` indique `https://app.openiaso.com`. Collez votre clé
   d'accès après `IASO_TOKEN=`. Enregistrez le fichier.
6. Recompressez le dossier du kit en zip.

!!! warning "Gardez votre clé d'accès privée"
    La clé d'accès fonctionne comme votre mot de passe. Ne la collez jamais dans la
    conversation et ne partagez jamais le zip une fois qu'il la contient. Gardez le kit
    avec sa clé en lieu sûr : il vous servira pour revenir vers l'assistant et faire des
    modifications plus tard (voir l'étape 7).

## Étape 4 : Donner le kit à votre assistant IA

1. Démarrez une nouvelle conversation dans Claude ou ChatGPT et joignez le zip enregistré à
   l'étape 3 (il contient maintenant votre clé d'accès). Avec Claude Code, ouvrez plutôt le
   dossier du kit au lieu de joindre le zip.
2. Choisissez l'origine de vos données géographiques :

**Option A : Utiliser les données géographiques de démonstration** (un jeu de lieux de
démonstration prêt à l'emploi, avec des réponses d'exemple). Copiez ce message, puis allez à
l'[étape 5](#etape-5-repondre-aux-questions-de-lassistant) pour répondre aux questions :

> Voici un kit pour configurer une campagne de distribution de MILDA dans IASO.
> Décompresse-le si besoin, lis `SKILL.md` et suis-le étape par étape pour me guider. N'utilise
> que les scripts du kit, aucun connecteur IASO. C'est une démo : utilise la pyramide de
> démonstration du kit et propose des réponses fictives pour tout, dans un seul récapitulatif
> (mode démo). Demande-moi confirmation avant chaque étape qui écrit dans IASO, et ne t'arrête
> qu'après la liste du § 12c.

**Option B : Utiliser vos propres données géographiques.** Allez à
[Utiliser vos propres données géographiques](#utiliser-vos-propres-donnees-geographiques) en
bas de cette page pour obtenir le bon message, puis continuez avec l'[étape 5](#etape-5-repondre-aux-questions-de-lassistant).

!!! warning "Vous utilisez Claude ? Préférez Claude Code"
    Si vous utilisez Claude, utilisez de préférence **Claude Code** (application de bureau ou
    terminal) pour éviter les limitations. Claude dans le navigateur ou dans son application
    ne peut joindre que les domaines d'une liste autorisée : avec un serveur IASO autre que
    **app.openiaso.com**, faites autoriser son domaine **avant** la session (sur les offres
    Team et Enterprise, seul un propriétaire de votre organisation Claude peut l'ajouter :
    voir l'astuce ci-dessous).

!!! tip "L'assistant n'arrive pas à joindre IASO ?"
    Les scripts du kit doivent accéder à app.openiaso.com par internet. Si l'assistant
    signale « Name or service not known » ou indique que son code ne peut pas se connecter,
    son code n'a pas le droit de joindre cette adresse :

    - **Claude, abonnement personnel** : dans **Paramètres > Capacités**, autorisez
      l'exécution de code à accéder au réseau et ajoutez exactement `app.openiaso.com`
      (`openiaso.com` seul ne suffit pas).
    - **Claude, abonnement Team ou Enterprise** : seul un propriétaire de votre organisation
      Claude peut le faire, dans **Paramètres de l'organisation > Capacités**. Vous pouvez lui
      envoyer ce message : *« Bonjour, j'utilise Claude pour configurer une campagne dans
      IASO. Peux-tu ajouter exactement app.openiaso.com aux domaines que l'exécution de code
      de Claude peut joindre (Paramètres de l'organisation > Capacités) ? Sans cela, Claude
      ne peut pas joindre notre serveur IASO. Merci ! »*
    - **ChatGPT** et les autres assistants : vérifiez dans leurs paramètres que l'exécution
      de code peut accéder à internet, ou à cette adresse.

    Demandez-lui ensuite de réessayer.

## Étape 5 : Répondre aux questions de l'assistant

L'assistant pose ses questions un thème à la fois (en démo, il propose toutes les réponses
d'un coup, dans un seul récapitulatif à valider). Il construit ensuite la campagne étape par
étape, en demandant votre accord à chaque fois : données géographiques, projets,
formulaires, registres, stock, utilisateurs, tableaux de bord et rapports mobiles.

L'assistant travaille dans son propre espace : demandez-lui de vous donner en téléchargement
les fichiers qu'il produit (QR codes, mots de passe des utilisateurs, sauvegarde).

## Étape 6 : Tester sur un téléphone

1. **Installez l'application IASO** sur un téléphone Android depuis
   [Google Play](https://play.google.com/store/apps/details?id=com.bluesquarehub.iaso&hl=fr)
   (ou scannez le QR code du Play Store que l'assistant vous donne).
2. **Trouvez les QR codes** dans IASO : ouvrez le menu et allez dans **Admin > Projets**.
   Chaque projet d'application mobile de la campagne y est listé, avec son QR code prêt à
   scanner.
3. **Ouvrez l'application IASO** sur le téléphone, choisissez de scanner un QR code et
   scannez le QR code du projet à tester. Acceptez les demandes d'autorisation qui
   s'affichent (appareil photo, localisation…).
4. **Connectez-vous** avec votre utilisateur principal.
5. Suivez le **test guidé** que l'assistant propose (enregistrer des ménages, distribuer des
   moustiquaires, saisir un mouvement de stock…).

## Étape 7 : Après la configuration

Pour modifier quelque chose dans la configuration de la campagne, demandez-le simplement à
l'assistant : revenez à la conversation dans laquelle vous avez joint le kit, qui contient
toujours votre clé d'accès.

## Utiliser vos propres données géographiques

Utilisez cette option pour configurer la campagne avec vos données géographiques réelles.
Reportez-vous au [guide utilisateur](../users/reference/user_guide.md#liste-des-sources-de-donnees)
pour plus de détails sur la façon de formater votre fichier GeoPackage ou Excel, ou de
connecter votre instance DHIS2. Puis, à l'[étape 4](#etape-4-donner-le-kit-a-votre-assistant-ia),
utilisez l'un de ces messages à la place du message de démonstration.

### Vos données géographiques dans un fichier Excel

Joignez le fichier Excel à la conversation, avec le zip, et copiez ce message :

> Voici un kit pour configurer une campagne de distribution de MILDA dans IASO.
> Décompresse-le si besoin, lis `SKILL.md` et suis-le étape par étape pour me guider. N'utilise
> que les scripts du kit, aucun connecteur IASO. Mes unités d'organisation sont dans le fichier
> Excel joint. Pose-moi les questions de la campagne une section à la fois. Demande-moi
> confirmation avant chaque étape qui écrit dans IASO, et ne t'arrête qu'après la liste du § 12c.

Avec un fichier GeoPackage, utilisez ce message en écrivant « GeoPackage » au lieu d'« Excel ».

### Vos données géographiques dans DHIS2

Votre DHIS2 doit déjà être configuré sur la source de données dans IASO. Copiez ce message :

> Voici un kit pour configurer une campagne de distribution de MILDA dans IASO.
> Décompresse-le si besoin, lis `SKILL.md` et suis-le étape par étape pour me guider. N'utilise
> que les scripts du kit, aucun connecteur IASO. Mes unités d'organisation viennent de notre
> DHIS2, déjà configuré sur la source de données IASO. Pose-moi les questions de la campagne une
> section à la fois. Demande-moi confirmation avant chaque étape qui écrit dans IASO, et ne
> t'arrête qu'après la liste du § 12c.

### Préparer les décisions de votre campagne

Plus vous avez déjà pris de décisions, plus la configuration est rapide. L'assistant vous les
demande à l'[étape 5](#etape-5-repondre-aux-questions-de-lassistant) :

| Thème | Questions | À préparer |
|---|---|---|
| Campagne | nom, pays, langues des formulaires, districts couverts, nombre de moustiquaires par ménage | la liste des districts, la règle d'attribution |
| Géographie | d'où viennent vos lieux, à quel niveau les ménages sont enregistrés (village, formation sanitaire…) | vos paramètres DHIS2 dans IASO, ou votre fichier Excel ou GeoPackage |
| Projets | quels projets mobiles sont nécessaires (dénombrement, distribution, groupes spéciaux, travailleurs, stock, supervision) | — |
| Rapports | quels tableaux de bord et rapports mobiles, la carte des ménages et ses noms de lieux, et qui peut ouvrir chaque page | la liste des personnes qui suivent la campagne |
| Travailleurs | les rôles, les taux journaliers, qui valide la présence | la grille de paiement |
| Stock | les magasins suivis, le nombre de moustiquaires par balle | la liste des magasins |
| Utilisateurs | qui utilise quel projet, dans quelle zone | la liste des agents |

## En savoir plus

- Le kit contient un guide détaillé (`GUIDE.html`) qui présente la campagne phase par phase,
  avec des captures d'écran de chaque outil.
- [Concepts IASO](../users/reference/iaso_concepts.md) et [Modules IASO](../users/reference/iaso_modules.md)
- [Application mobile IASO](../users/reference/iaso_mobile.md)
