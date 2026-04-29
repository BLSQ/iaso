# Utiliser Form AI

Le **Form AI** est un assistant alimenté par l'IA qui vous permet de créer et de modifier des formulaires ODK XLSForm en langage naturel. Au lieu de construire un formulaire manuellement dans un tableur, vous décrivez vos besoins dans un chat, et Form AI génère un XLSForm prêt à l'emploi.

## Prérequis

Avant d'utiliser le Form AI, les conditions suivantes doivent être remplies :

- Le module **Form AI** doit être activé pour votre organisation par un administrateur (via **Paramètres → Modules**).
- Votre compte utilisateur doit disposer de la permission **Gestion des formulaires** (`iaso_forms`).
- Votre compte IASO doit disposer d'une **clé API Anthropic** configurée par un administrateur. Si la clé est absente, Form AI retournera un message d'erreur vous invitant à contacter votre administrateur.

## Accéder au Form AI

Dans le menu de navigation à gauche, allez dans **Formulaires → Form AI**.

La page est divisée en deux panneaux :

| Panneau | Utilité |
|---------|---------|
| **Gauche – Chat** | Saisissez vos requêtes et consultez l'historique de la conversation. |
| **Droite – Aperçu** | Visualisez en temps réel le formulaire généré, rendu comme un formulaire ODK Web. |

## Créer un nouveau formulaire

1. Assurez-vous qu'aucun formulaire existant n'est chargé (la liste déroulante "Charger un formulaire existant" est vide).
2. Saisissez une description du formulaire souhaité dans le champ de saisie du chat en bas du panneau gauche.  
   *Exemple :* `Crée une enquête ménage avec les champs : nom, âge, sexe et localisation GPS.`
3. Cliquez sur **Envoyer** (ou appuyez sur Entrée).
4. Le Copilote génère le formulaire et affiche :
   - Une courte explication de ce qui a été créé dans le chat.
   - Un aperçu en direct du formulaire dans le panneau de droite.
5. Vous pouvez continuer à affiner le formulaire en envoyant des messages de suivi.  
   *Exemple :* `Rends le champ âge obligatoire et ajoute une question numéro de téléphone après le nom.`

Chaque message est envoyé avec l'historique complet de la conversation, de sorte que Form AI conserve toujours le contexte de ce qui a déjà été créé.

## Charger un formulaire existant pour le modifier

Vous pouvez charger un formulaire IASO existant dans Form AI pour le modifier avec l'aide de l'IA.

1. Cliquez sur la liste déroulante **"Charger un formulaire existant"** en haut du panneau gauche.
2. Recherchez et sélectionnez le formulaire à modifier. Seuls les formulaires disposant d'au moins une version XLSForm sont listés.
3. Le Copilote charge la structure actuelle du formulaire dans le contexte de la conversation et affiche un message de confirmation.
4. Demandez des modifications dans le chat comme pour un nouveau formulaire.  
   *Exemple :* `Ajoute une section sur les biens du ménage et rends la question GPS facultative.`

!!! note
    Lors de la modification d'un formulaire existant, Form AI préserve toujours l'`form_id` ODK d'origine du formulaire. Cela garantit que l'enregistrement du résultat comme nouvelle version passe les contrôles de cohérence d'IASO.

!!! note
    La modification d'un formulaire via Form AI entraîne la perte de la mise en forme (couleurs des cellules, par exemple) du XLSForm d'origine.

## Enregistrer le formulaire généré

Lorsque vous êtes satisfait du résultat, un bouton **Enregistrer le formulaire** apparaît en bas à droite de l'écran.

### Enregistrer comme nouvelle version d'un formulaire existant

Si un formulaire a été chargé ou précédemment enregistré :

1. Cliquez sur **Enregistrer le formulaire**.
2. La boîte de dialogue affiche le nom du formulaire actuellement chargé. Confirmez en cliquant sur **Enregistrer**.
3. Une nouvelle version du formulaire est créée dans IASO. Vous la trouverez dans **Formulaires → Liste des formulaires** sous l'historique des versions du formulaire, ou via le bouton "Voir les propriétés".

### Enregistrer comme tout nouveau formulaire

Si aucun formulaire n'est encore chargé :

1. Cliquez sur **Enregistrer le formulaire**.
2. Remplissez les champs requis :
   - **Nom du formulaire** – le nom d'affichage du nouveau formulaire dans IASO.
   - **Projets** – associez le formulaire à un ou plusieurs projets.
   - **Identifiant du formulaire (ODK)** *(facultatif)* – un identifiant unique en snake_case écrit dans les paramètres XLS. Laissez vide pour utiliser l'identifiant généré par l'IA.
3. Cliquez sur **Enregistrer**.
4. Le nouveau formulaire apparaît dans **Formulaires → Liste des formulaires**.

## Télécharger le XLSForm

À tout moment après la génération d'un formulaire, vous pouvez télécharger le fichier Excel XLSForm brut :

1. Dans le panneau de droite, cliquez sur le bouton **Télécharger le XLSForm**.
2. Un fichier `.xlsx` est enregistré sur votre ordinateur.
3. Vous pouvez ouvrir ce fichier dans Excel ou LibreOffice Calc pour l'inspecter ou le modifier davantage avant de le téléverser manuellement via **Formulaires → Liste des formulaires → Créer**.

## Conseils pour rédiger de bonnes requêtes

- **Précisez le type de champ.** Au lieu de "ajouter une question sur les vaccins", écrivez "ajouter une question `select_multiple` listant les vaccins reçus : OPV, VPI, Penta, MenA".
- **Demandez explicitement la logique de saut.** Exemple : "Afficher la section grossesse uniquement si le sexe est féminin".
- **Demandez des regroupements.** Exemple : "Regrouper les questions sur les informations du ménage sous une section appelée 'Informations du ménage'".
- **Itérez étape par étape.** Faites un changement à la fois plutôt que de demander plusieurs modifications à la fois — cela donne des résultats plus prévisibles.
- **Vérifiez l'aperçu.** Le panneau de droite affiche le formulaire en temps réel ; utilisez-le pour vérifier la structure et l'ordre des questions avant d'enregistrer.

## Limitations

- Le Copilote génère des formulaires basés sur la spécification standard ODK XLSForm. Les fonctionnalités XLSForm très personnalisées ou non standard peuvent ne pas être gérées correctement.
- L'historique de conversation est géré côté client. Rafraîchir la page effacera le chat et le brouillon du formulaire en cours. Téléchargez ou enregistrez votre formulaire avant de quitter la page.
- Seul le formulaire généré le plus récent est disponible au téléchargement ou à l'enregistrement. Les brouillons antérieurs de la même session ne sont pas conservés.
