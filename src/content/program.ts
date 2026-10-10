// Programme « 21 jours jambes légères ».
// ⚠️ Contenu V0 rédigé avec des gestes doux et courants (mobilité de cheville, auto-massage léger, jambes surélevées).
// À FAIRE VALIDER par un·e kinésithérapeute avant production (docs/WORDING.md).
// Le contenu vit dans le code : dispo hors ligne, versionné, zéro requête réseau.

export type Localized = { fr: string; ar: string };

export type StepKind = 'timer' | 'reps' | 'massage' | 'water';

export type Exercise = {
  id: string;
  kind: StepKind;
  title: Localized;
  instructions: Localized;
  /** Durée totale de l'étape (s). */
  durationSec: number;
  /** Rythme guidé (ms) : une pulsation visuelle + haptique à chaque mouvement. */
  pulseMs?: number;
};

const L = (fr: string, ar: string): Localized => ({ fr, ar });

export const EXERCISES = {
  breath: {
    id: 'breath',
    kind: 'timer',
    title: L('Respiration ventrale', 'تنفّس بطني'),
    instructions: L(
      'Assise ou allongée, une main sur le ventre. Inspire par le nez en gonflant le ventre, expire lentement par la bouche.',
      'جالسة أو مستلقية، يدك على بطنك. استنشقي من الأنف مع نفخ البطن، ثم ازفري ببطء من الفم.',
    ),
    durationSec: 60,
    pulseMs: 5000,
  },
  anklePumps: {
    id: 'anklePumps',
    kind: 'reps',
    title: L('Pompes de chevilles', 'تحريك الكاحلين'),
    instructions: L(
      'Jambes allongées, pointe les pieds vers l’avant puis ramène-les vers toi. Un mouvement à chaque vague.',
      'الساقان ممدودتان، وجّهي القدمين إلى الأمام ثم اسحبيهما نحوك. حركة مع كل موجة.',
    ),
    durationSec: 40,
    pulseMs: 2000,
  },
  ankleCircles: {
    id: 'ankleCircles',
    kind: 'reps',
    title: L('Cercles de chevilles', 'دوائر بالكاحلين'),
    instructions: L(
      'Dessine de grands cercles avec tes pieds, 10 dans un sens puis 10 dans l’autre.',
      'ارسمي دوائر كبيرة بقدميك، 10 في اتجاه ثم 10 في الاتجاه الآخر.',
    ),
    durationSec: 50,
    pulseMs: 2500,
  },
  massageLowerRight: {
    id: 'massageLowerRight',
    kind: 'massage',
    title: L('Auto-massage · jambe droite (cheville → genou)', 'تدليك ذاتي · الساق اليمنى (الكاحل ← الركبة)'),
    instructions: L(
      'Mains à plat, glisse lentement de la cheville vers le genou, toujours en remontant. Pression légère, jamais douloureuse.',
      'اليدان مسطّحتان، مرّريهما ببطء من الكاحل نحو الركبة، دائماً إلى الأعلى. ضغط خفيف، دون ألم أبداً.',
    ),
    durationSec: 60,
    pulseMs: 3000,
  },
  massageLowerLeft: {
    id: 'massageLowerLeft',
    kind: 'massage',
    title: L('Auto-massage · jambe gauche (cheville → genou)', 'تدليك ذاتي · الساق اليسرى (الكاحل ← الركبة)'),
    instructions: L(
      'Même geste sur l’autre jambe : de la cheville vers le genou, en douceur.',
      'نفس الحركة على الساق الأخرى: من الكاحل نحو الركبة، بلطف.',
    ),
    durationSec: 60,
    pulseMs: 3000,
  },
  massageUpper: {
    id: 'massageUpper',
    kind: 'massage',
    title: L('Auto-massage · genoux → cuisses', 'تدليك ذاتي · الركبتان ← الفخذان'),
    instructions: L(
      'Glisse de l’arrière du genou vers le haut de la cuisse, une jambe puis l’autre. Gestes lents et enveloppants.',
      'مرّري يديك من خلف الركبة نحو أعلى الفخذ، ساقاً بعد الأخرى. حركات بطيئة ولطيفة.',
    ),
    durationSec: 80,
    pulseMs: 3000,
  },
  calfRaises: {
    id: 'calfRaises',
    kind: 'reps',
    title: L('Montées sur pointes', 'الصعود على أطراف الأصابع'),
    instructions: L(
      'Debout, une main sur un mur ou une chaise. Monte doucement sur la pointe des pieds, redescends lentement.',
      'واقفة، يدك على حائط أو كرسي. اصعدي بلطف على أطراف أصابعك، ثم انزلي ببطء.',
    ),
    durationSec: 45,
    pulseMs: 3000,
  },
  calfStretch: {
    id: 'calfStretch',
    kind: 'timer',
    title: L('Étirement des mollets', 'تمديد بطّة الساق'),
    instructions: L(
      'Face au mur, un pied en arrière talon au sol. Penche-toi doucement, 20 secondes par jambe.',
      'مقابل الحائط، قدم إلى الخلف والكعب على الأرض. انحني بلطف، 20 ثانية لكل ساق.',
    ),
    durationSec: 40,
  },
  legsUp: {
    id: 'legsUp',
    kind: 'timer',
    title: L('Jambes surélevées', 'رفع الساقين'),
    instructions: L(
      'Allongée, pose tes jambes sur un coussin ou contre un mur. Relâche-toi et respire calmement.',
      'مستلقية، ضعي ساقيك على وسادة أو على الحائط. استرخي وتنفّسي بهدوء.',
    ),
    durationSec: 120,
  },
  water: {
    id: 'water',
    kind: 'water',
    title: L('Un grand verre d’eau', 'كأس كبير من الماء'),
    instructions: L(
      'Termine ta routine en buvant un verre d’eau. Il sera ajouté à ton suivi du jour.',
      'اختمي روتينك بشرب كأس ماء. سيُضاف إلى متابعة يومك.',
    ),
    durationSec: 15,
  },
} as const satisfies Record<string, Exercise>;

export type ExerciseId = keyof typeof EXERCISES;

export type ProgramDay = { day: number; title: Localized; steps: readonly ExerciseId[] };

const WEEK1: readonly ExerciseId[] = ['breath', 'anklePumps', 'ankleCircles', 'massageLowerRight', 'massageLowerLeft', 'legsUp', 'water'];
const WEEK2: readonly ExerciseId[] = ['breath', 'anklePumps', 'calfRaises', 'massageLowerRight', 'massageLowerLeft', 'massageUpper', 'legsUp', 'water'];
const WEEK3: readonly ExerciseId[] = ['breath', 'anklePumps', 'ankleCircles', 'calfRaises', 'calfStretch', 'massageLowerRight', 'massageLowerLeft', 'massageUpper', 'legsUp', 'water'];

const TITLES: readonly Localized[] = [
  L('Premier pas', 'الخطوة الأولى'),
  L('Réveil des chevilles', 'إيقاظ الكاحلين'),
  L('Le bon rythme', 'الإيقاع المناسب'),
  L('Douceur du soir', 'لطف المساء'),
  L('Prendre le pli', 'اكتساب العادة'),
  L('Pause jambes', 'استراحة للساقين'),
  L('Bilan de semaine', 'حصيلة الأسبوع'),
  L('On monte d’un cran', 'خطوة إلى الأمام'),
  L('Mollets en forme', 'بطّة ساق نشيطة'),
  L('Légèreté', 'خفّة'),
  L('Mi-parcours', 'منتصف الطريق'),
  L('Routine ancrée', 'روتين راسخ'),
  L('Respire', 'تنفّسي'),
  L('Deux semaines !', 'أسبوعان!'),
  L('Version complète', 'النسخة الكاملة'),
  L('Fluidité', 'انسيابية'),
  L('Énergie douce', 'طاقة لطيفة'),
  L('Mon moment', 'لحظتي'),
  L('Presque au bout', 'تقريباً في النهاية'),
  L('Fierté', 'فخر'),
  L('Jour 21 · Bravo', 'اليوم 21 · برافو'),
];

export const PROGRAM_SLUG = 'jambes-legeres-21';
export const PROGRAM_LENGTH = 21;

export const PROGRAM: readonly ProgramDay[] = TITLES.map((title, i) => ({
  day: i + 1,
  title,
  steps: i < 7 ? WEEK1 : i < 14 ? WEEK2 : WEEK3,
}));

export function dayDurationSec(day: ProgramDay): number {
  return day.steps.reduce((sum, id) => sum + EXERCISES[id].durationSec, 0);
}

export function getDay(dayNumber: number): ProgramDay | undefined {
  return PROGRAM[dayNumber - 1];
}
