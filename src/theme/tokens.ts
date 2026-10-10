// Design tokens PlushUp — source unique de vérité pour couleurs, espacements, rayons.
// Contrastes vérifiés (WCAG AA ≥ 4.5:1 pour le texte) :
//   deep #0F4648 sur cream #F7F5EF ≈ 10.4:1 · muted #4E6E6E sur cream ≈ 5.2:1 · white sur deep ≈ 11:1
// Les menthes (#BFE8D4, #AFD8C6) ne servent JAMAIS de couleur de texte : uniquement fonds / remplissages.

export const colors = {
  deep: '#0F4648',
  teal: '#155C5B',
  mint: '#BFE8D4',
  sage: '#AFD8C6',
  mintSoft: '#E4F4EC',
  cream: '#F7F5EF',
  sand: '#EDE6D8',
  white: '#FFFFFF',
  ink: '#0F4648',
  muted: '#4E6E6E',
  line: '#D9E3DF',
  // Échelle de ressenti : sable (moyen) → ambre (lourd), jamais de rouge (pas de culpabilisation).
  // Texte sur ambre : toujours `ink` (5,2:1) ; amberInk seulement sur sandWarm (5,5:1).
  sandWarm: '#F2E3BD',
  amber: '#E3A95C',
  amberInk: '#7A4E0E',
  // Réservé à la page sécurité (signaux d'alerte).
  alert: '#9F2A22',
  alertSoft: '#F8E3E0',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 } as const;

export const fontSize = { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, xxl: 28, hero: 34 } as const;

// Zone tactile minimale (Apple HIG 44pt, Material 48dp) → on prend 48.
export const touch = 48;

// Largeur max du contenu : sur desktop/tablette la webapp reste une colonne « mobile ».
export const maxContentWidth = 520;
