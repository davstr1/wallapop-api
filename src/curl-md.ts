import {
  curlSearch, curlItem, curlUser, curlUserStats,
  curlUserItems, curlCategories, curlInbox, curlExtractItemId,
} from './curl';

export function generateCurlMd(): string {
  return `# Wallapop API — Curl Cheatsheet

> Commandes curl prêtes à copier-coller. Aucun serveur requis.
> Généré automatiquement depuis la codebase.

---

## Headers obligatoires

Tous les endpoints publics nécessitent exactement ces deux headers :

\`\`\`
Host: api.wallapop.com
X-DeviceOS: 0
\`\`\`

⚠️ **Proxy recommandé** — Wallapop bloque les IP serveur. Ajouter \`--proxy http://user:pass@host:port\` si nécessaire.

---

## 1. 🔍 Search — Rechercher des annonces

Chercher des items par mots-clés, prix, localisation, catégorie.

### Recherche simple

\`\`\`bash
${curlSearch({ keywords: 'iphone 13' })}
\`\`\`

### Avec filtres de prix

\`\`\`bash
${curlSearch({ keywords: 'iphone', min_sale_price: 200, max_sale_price: 500 })}
\`\`\`

### Avec localisation (Barcelona, rayon 10km)

\`\`\`bash
${curlSearch({ keywords: 'vélo', latitude: 41.3851, longitude: 2.1734, distance: 10000 })}
\`\`\`

### Avec catégorie + tri

\`\`\`bash
${curlSearch({ keywords: 'seat', category_id: 12465, order_by: 'price_low_to_high' })}
\`\`\`

### Pagination (page suivante)

Récupérer le token \`meta.next_page\` de la réponse précédente :

\`\`\`bash
${curlSearch({ next_page: '<TOKEN_DE_LA_REPONSE_PRECEDENTE>' })}
\`\`\`

### Paramètres disponibles

| Param | Type | Description |
|-------|------|-------------|
| \`keywords\` | string | Mots-clés de recherche |
| \`min_sale_price\` | number | Prix minimum (€) |
| \`max_sale_price\` | number | Prix maximum (€) |
| \`distance\` | number | Rayon en mètres |
| \`latitude\` | number | Latitude (-90 à 90) |
| \`longitude\` | number | Longitude (-180 à 180) |
| \`category_id\` | number | ID catégorie parente |
| \`subcategory_ids\` | string | Sous-catégories (virgules) |
| \`order_by\` | string | \`newest\` \\| \`price_low_to_high\` \\| \`price_high_to_low\` \\| \`distance\` |
| \`limit\` | number | Items par page (max 40) |
| \`step\` | number | Toujours \`1\` |
| \`source\` | string | Toujours \`keywords\` |
| \`next_page\` | string | Token de pagination |

---

## 2. 📦 Item Details — Détails d'une annonce

Récupérer toutes les infos d'un item par son ID.

\`\`\`bash
${curlItem('nz047v45rrjo')}
\`\`\`

> ⚠️ Prix en **centimes** ici (\`75000\` = 750€), contrairement à \`/search\` qui retourne en euros.

---

## 3. 👤 User Profile — Profil vendeur

\`\`\`bash
${curlUser('qjwy4weydwzo')}
\`\`\`

---

## 4. 📊 User Stats — Statistiques vendeur

Nombre de ventes, avis, note.

\`\`\`bash
${curlUserStats('qjwy4weydwzo')}
\`\`\`

> Rating sur 100. Diviser par 20 pour une note /5 (ex: 85 → 4.25⭐).

---

## 5. 🛍️ User Items — Annonces d'un vendeur

\`\`\`bash
${curlUserItems('qjwy4weydwzo')}
\`\`\`

Avec limite :

\`\`\`bash
${curlUserItems('qjwy4weydwzo', { limit: 20 })}
\`\`\`

---

## 6. 📂 Categories — Arbre des catégories

\`\`\`bash
${curlCategories()}
\`\`\`

---

## 7. 💬 Inbox — Messagerie (auth requise)

⚠️ Nécessite un **Bearer token** utilisateur Wallapop (voir section en bas).

\`\`\`bash
${curlInbox('<TON_BEARER_TOKEN>')}
\`\`\`

Avec paramètres custom :

\`\`\`bash
${curlInbox('<TON_BEARER_TOKEN>', { pageSize: 50, maxMessages: 5 })}
\`\`\`

---

## 8. 🔗 Extraire un Item ID depuis une URL

Wallapop utilise des slugs dans les URLs mais l'API a besoin de l'ID interne.

\`\`\`bash
${curlExtractItemId('https://es.wallapop.com/item/consola-sony-ps4-pro-1173684438')}
\`\`\`

---

## 🔐 Comment récupérer le Bearer Token

1. Ouvrir **es.wallapop.com** → se connecter
2. DevTools (\`F12\`) → onglet **Network**
3. Aller dans ses messages ou faire une action authentifiée
4. Chercher une requête vers \`api.wallapop.com\`
5. Dans les Request Headers → copier \`Authorization: Bearer eyJ...\`

Le token expire après quelques heures/jours.

---

## ⚠️ Notes

- **Proxy** : ajouter \`--proxy http://user:pass@host:port\` si les requêtes directes sont bloquées
- **Pagination** : token opaque \`next_page\` (pas de numéro de page)
- **Rate limiting** : mettre un délai entre les requêtes en batch
- **Throttling** : si >95% de 404, c'est du throttling, pas des vrais 404
`;
}
