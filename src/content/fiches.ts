// Fiches éducatives courtes. Règle : ressenti, confort, habitudes — aucune promesse physiologique.
import type { Localized } from './program';

export type Fiche = {
  slug: string;
  emoji: string;
  minutes: number;
  title: Localized;
  paragraphs: readonly Localized[];
};

const L = (fr: string, ar: string): Localized => ({ fr, ar });

export const FICHES: readonly Fiche[] = [
  {
    slug: 'jambes-lourdes-le-soir',
    emoji: '🌙',
    minutes: 2,
    title: L('Pourquoi les jambes semblent lourdes le soir', 'لماذا تبدو الساقان ثقيلتين في المساء'),
    paragraphs: [
      L(
        'Rester longtemps assise ou debout, la chaleur, peu de mouvement dans la journée : beaucoup de femmes ressentent des jambes plus lourdes en fin de journée.',
        'الجلوس أو الوقوف لمدة طويلة، الحرارة، قلّة الحركة خلال اليوم: كثير من النساء يشعرن بثقل في الساقين في آخر النهار.',
      ),
      L(
        'Bouger les chevilles régulièrement, marcher un peu, boire de l’eau et surélever les jambes le soir sont des habitudes simples qui aident à se sentir plus légère.',
        'تحريك الكاحلين بانتظام، المشي قليلاً، شرب الماء ورفع الساقين في المساء عادات بسيطة تساعد على الإحساس بالخفّة.',
      ),
      L(
        'Ton journal t’aide à repérer ce qui marche pour toi. Si une gêne est inhabituelle, douloureuse ou ne touche qu’une jambe, parles-en à un médecin.',
        'تساعدك يومياتك على معرفة ما يناسبك. إذا كان الانزعاج غير معتاد أو مؤلماً أو يخصّ ساقاً واحدة، تحدّثي مع طبيب.',
      ),
    ],
  },
  {
    slug: 'bien-porter-son-legging',
    emoji: '🩱',
    minutes: 2,
    title: L('Bien porter son legging gainant', 'كيف ترتدين الليغينغ الضاغط'),
    paragraphs: [
      L(
        'Enfile-le le matin, assise, en le remontant progressivement. Il doit t’envelopper et te maintenir, sans jamais faire mal.',
        'ارتديه في الصباح وأنتِ جالسة مع رفعه تدريجياً. يجب أن يحيط بك ويدعمك دون أن يؤلمك أبداً.',
      ),
      L(
        'Commence par quelques heures par jour, puis écoute tes sensations. Le journal te permet de voir quel moment de port te convient le mieux.',
        'ابدئي ببضع ساعات في اليوم، ثم أنصتي لإحساسك. تسمح لك اليوميات بمعرفة الوقت الأنسب لك للارتداء.',
      ),
      L(
        'Retire-le pour dormir. S’il serre, marque la peau, gratte ou engourdit, retire-le et vérifie ta taille dans le guide.',
        'انزعيه عند النوم. إذا ضغط أو ترك أثراً على الجلد أو سبّب حكّة أو تنميلاً، انزعيه وتحقّقي من مقاسك في الدليل.',
      ),
    ],
  },
  {
    slug: 'hydratation-chaleur-ramadan',
    emoji: '💧',
    minutes: 2,
    title: L('Hydratation : chaleur et Ramadan', 'شرب الماء: الحرارة ورمضان'),
    paragraphs: [
      L(
        'Quand il fait chaud, on a souvent les jambes plus « lourdes ». Boire régulièrement dans la journée fait partie d’une bonne routine.',
        'عندما يكون الجوّ حارّاً، نشعر غالباً بثقل أكبر في الساقين. شرب الماء بانتظام خلال اليوم جزء من روتين جيّد.',
      ),
      L(
        'Pendant le Ramadan, répartis tes verres d’eau entre le ftour et le shour plutôt que de tout boire d’un coup.',
        'في رمضان، وزّعي كؤوس الماء بين الفطور والسحور بدل شربها دفعة واحدة.',
      ),
      L(
        'Astuce : le bouton « +1 verre » de l’accueil te permet de suivre ton hydratation en une seconde.',
        'نصيحة: زرّ « +1 كأس » في الصفحة الرئيسية يتيح لك متابعة شرب الماء في ثانية.',
      ),
    ],
  },
  {
    slug: 'bouger-au-travail',
    emoji: '💼',
    minutes: 2,
    title: L('Bouger même au bureau', 'الحركة حتى في المكتب'),
    paragraphs: [
      L(
        'Assise toute la journée ? Toutes les heures, fais 10 pompes de chevilles sous ton bureau : personne ne le verra.',
        'جالسة طوال اليوم؟ كل ساعة، حرّكي كاحليك 10 مرات تحت المكتب: لن يلاحظ أحد.',
      ),
      L(
        'Debout toute la journée ? Monte sur la pointe des pieds quelques fois et change d’appui régulièrement.',
        'واقفة طوال اليوم؟ اصعدي على أطراف أصابعك بضع مرات وغيّري وضعية الوقوف بانتظام.',
      ),
      L(
        'Prends l’escalier quand tu peux, et marche quelques minutes après le déjeuner.',
        'استعملي الدرج عندما يمكنك ذلك، وامشي بضع دقائق بعد الغداء.',
      ),
    ],
  },
  {
    slug: 'gestes-auto-massage',
    emoji: '🤲',
    minutes: 3,
    title: L('Les bons gestes d’auto-massage', 'حركات التدليك الذاتي الصحيحة'),
    paragraphs: [
      L(
        'Toujours de bas en haut : de la cheville vers le genou, puis du genou vers la cuisse. Mains à plat, gestes lents et réguliers.',
        'دائماً من الأسفل إلى الأعلى: من الكاحل نحو الركبة، ثم من الركبة نحو الفخذ. اليدان مسطّحتان، حركات بطيئة ومنتظمة.',
      ),
      L(
        'La pression reste légère, comme une caresse appuyée. Un massage n’a jamais besoin de faire mal.',
        'الضغط يبقى خفيفاً، كلمسة مع قليل من الضغط. التدليك لا يحتاج أبداً أن يؤلم.',
      ),
      L(
        'Évite les zones douloureuses, irritées ou avec des varices marquées. Une crème ou une huile facilite le glissement.',
        'تجنّبي المناطق المؤلمة أو المتهيّجة أو التي بها دوالي واضحة. كريم أو زيت يسهّل الانزلاق.',
      ),
    ],
  },
  {
    slug: 'rituel-du-soir',
    emoji: '🛋️',
    minutes: 2,
    title: L('Le rituel du soir en 5 minutes', 'طقس المساء في 5 دقائق'),
    paragraphs: [
      L(
        'Retire ton legging, fais quelques cercles de chevilles, puis allonge-toi les jambes surélevées sur un coussin.',
        'انزعي الليغينغ، قومي ببعض الدوائر بكاحليك، ثم استلقي مع رفع ساقيك على وسادة.',
      ),
      L(
        'Profite de ce moment pour faire ton check-in : 30 secondes pour noter tes sensations de la journée.',
        'استغلّي هذه اللحظة لتسجيل يومك: 30 ثانية لتدوين إحساسك خلال اليوم.',
      ),
    ],
  },
];

export function getFiche(slug: string): Fiche | undefined {
  return FICHES.find((f) => f.slug === slug);
}

export type Tip = { text: Localized; fiche?: string };

export const TIPS: readonly Tip[] = [
  { text: L('Fais 10 pompes de chevilles maintenant : 20 secondes suffisent.', 'حرّكي كاحليك 10 مرات الآن: 20 ثانية تكفي.'), fiche: 'bouger-au-travail' },
  { text: L('Un verre d’eau avant chaque repas, c’est facile à retenir.', 'كأس ماء قبل كل وجبة، عادة سهلة التذكّر.'), fiche: 'hydratation-chaleur-ramadan' },
  { text: L('Ce soir, 2 minutes jambes surélevées contre le mur.', 'هذا المساء، دقيقتان مع رفع الساقين على الحائط.'), fiche: 'rituel-du-soir' },
  { text: L('Auto-massage : toujours de la cheville vers le genou.', 'التدليك الذاتي: دائماً من الكاحل نحو الركبة.'), fiche: 'gestes-auto-massage' },
  { text: L('Enfile ton legging assise, en le remontant petit à petit.', 'ارتدي الليغينغ وأنتِ جالسة مع رفعه شيئاً فشيئاً.'), fiche: 'bien-porter-son-legging' },
  { text: L('Marche 10 minutes après le déjeuner aujourd’hui.', 'امشي 10 دقائق بعد الغداء اليوم.'), fiche: 'bouger-au-travail' },
  { text: L('Le soir est le meilleur moment pour ton check-in.', 'المساء هو أفضل وقت لتسجيل يومك.'), fiche: 'rituel-du-soir' },
  { text: L('Il fait chaud ? Pense à boire régulièrement.', 'الجوّ حارّ؟ تذكّري أن تشربي الماء بانتظام.'), fiche: 'hydratation-chaleur-ramadan' },
  { text: L('Lave ton legging à 30 °C, sans adoucissant.', 'اغسلي الليغينغ على 30 درجة، دون مليّن.') },
  { text: L('Change d’appui toutes les 15 minutes si tu restes debout.', 'غيّري وضعية الوقوف كل 15 دقيقة إذا بقيتِ واقفة.'), fiche: 'bouger-au-travail' },
  { text: L('Une gêne inhabituelle sur une seule jambe ? Consulte.', 'انزعاج غير معتاد في ساق واحدة؟ استشيري طبيباً.'), fiche: 'jambes-lourdes-le-soir' },
  { text: L('Respire profondément 5 fois avant de dormir.', 'تنفّسي بعمق 5 مرات قبل النوم.') },
];

export function tipOfTheDay(dayIndex: number): Tip {
  return TIPS[((dayIndex % TIPS.length) + TIPS.length) % TIPS.length]!;
}
