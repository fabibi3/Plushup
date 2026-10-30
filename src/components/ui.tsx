// Primitives UI. Règles : zones tactiles ≥ 48, styles logiques (start/end) pour le RTL, accessibilité native.
import { router } from 'expo-router';
import { memo, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useT } from '@/i18n';
import { tapLight } from '@/lib/haptics';
import { useApp } from '@/store/useApp';
import { fontFamily } from '@/theme/fonts';
import { colors, maxContentWidth, radius, space, touch } from '@/theme/tokens';

import { Icon, type IconName } from './Icon';
import { Txt } from './Txt';

// ---------------------------------------------------------------------------
// Écran : safe area + scroll + colonne centrée (la webapp desktop garde un format mobile).
// ---------------------------------------------------------------------------
export function Screen({
  children,
  scroll = true,
  footer,
  bg = colors.cream,
  edges = ['top'],
}: {
  children: ReactNode;
  scroll?: boolean;
  footer?: ReactNode;
  bg?: string;
  edges?: ('top' | 'bottom')[];
}) {
  const body = scroll ? (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.column}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.column, styles.fill, styles.pad]}>{children}</View>
  );
  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: bg }]} edges={edges}>
      {body}
      {footer ? (
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <View style={styles.column}>{footer}</View>
        </SafeAreaView>
      ) : null}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// En-tête des écrans empilés (retour + titre).
// ---------------------------------------------------------------------------
export function Header({ title, onBack, right }: { title?: string; onBack?: () => void; right?: ReactNode }) {
  const t = useT();
  const back = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')));
  return (
    <View style={styles.header}>
      <Pressable onPress={back} accessibilityRole="button" accessibilityLabel={t.common.back} hitSlop={8} style={styles.iconBtn}>
        <Icon name="back" />
      </Pressable>
      <Txt variant="h2" style={styles.headerTitle} numberOfLines={1}>
        {title ?? ''}
      </Txt>
      <View style={styles.headerRight}>{right}</View>
    </View>
  );
}

// ---------------------------------------------------------------------------
export const Card = memo(function Card({ children, style, tone = 'white' }: { children: ReactNode; style?: ViewStyle; tone?: 'white' | 'mint' | 'deep' | 'sand' }) {
  const bg = { white: colors.white, mint: colors.mintSoft, deep: colors.deep, sand: colors.sand }[tone];
  return <View style={[styles.card, { backgroundColor: bg }, style]}>{children}</View>;
});

export function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.rowBetween}>
        <Txt variant="h2">{title}</Txt>
        {action}
      </View>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  small,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
}) {
  const palette = {
    primary: { bg: colors.deep, fg: colors.white, border: colors.deep },
    secondary: { bg: colors.white, fg: colors.deep, border: colors.line },
    ghost: { bg: 'transparent', fg: colors.deep, border: 'transparent' },
    danger: { bg: colors.white, fg: colors.alert, border: colors.alertSoft },
  }[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={() => {
        tapLight();
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: palette.bg, borderColor: palette.border, opacity: inactive ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      {loading ? <ActivityIndicator color={palette.fg} /> : icon ? <Icon name={icon} color={palette.fg} size={20} /> : null}
      <Txt weight="semibold" color={palette.fg} variant={small ? 'small' : 'body'}>
        {label}
      </Txt>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Puces de sélection (simple ou multiple).
// ---------------------------------------------------------------------------
export function Chip({ label, selected, onPress, grow }: { label: string; selected: boolean; onPress: () => void; grow?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        tapLight();
        onPress();
      }}
      style={({ pressed }) => [
        styles.chip,
        grow && styles.grow,
        selected ? styles.chipOn : styles.chipOff,
        pressed && { opacity: 0.85 },
      ]}
    >
      <Txt variant="small" weight="semibold" color={selected ? colors.white : colors.deep} center>
        {label}
      </Txt>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return <View style={styles.chipRow}>{children}</View>;
}

// ---------------------------------------------------------------------------
// Échelle 0 → 4 avec emoji : saisie en 1 tap, lisible sans savoir lire (pictogrammes).
// ---------------------------------------------------------------------------
const FACES = ['😌', '🙂', '😐', '😕', '😣'] as const;
const COMFORT_FACES = ['😣', '😕', '😐', '🙂', '😌'] as const;

export function ScaleSelector({
  value,
  onChange,
  labels,
  inverted,
}: {
  value: number | null;
  onChange: (v: 0 | 1 | 2 | 3 | 4) => void;
  labels: readonly string[];
  /** true : 4 = mieux (confort). */
  inverted?: boolean;
}) {
  const faces = inverted ? COMFORT_FACES : FACES;
  return (
    <View>
      <View style={styles.scaleRow}>
        {faces.map((face, i) => {
          const selected = value === i;
          return (
            <Pressable
              key={i}
              accessibilityRole="radio"
              accessibilityLabel={labels[i]}
              accessibilityState={{ selected }}
              onPress={() => {
                tapLight();
                onChange(i as 0 | 1 | 2 | 3 | 4);
              }}
              style={[styles.scaleItem, selected && styles.scaleItemOn]}
            >
              <Txt style={styles.face}>{face}</Txt>
            </Pressable>
          );
        })}
      </View>
      <Txt variant="small" color={colors.muted} center style={{ marginTop: space.xs, minHeight: 20 }}>
        {value == null ? ' ' : labels[value]}
      </Txt>
    </View>
  );
}

// ---------------------------------------------------------------------------
export function Stepper({ value, onChange, min = 0, max = 20, label }: { value: number; onChange: (v: number) => void; min?: number; max?: number; label: string }) {
  return (
    <View style={styles.stepper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} -1`}
        disabled={value <= min}
        onPress={() => {
          tapLight();
          onChange(Math.max(min, value - 1));
        }}
        style={[styles.stepBtn, value <= min && { opacity: 0.4 }]}
      >
        <Icon name="minus" />
      </Pressable>
      <Txt variant="title" style={styles.stepValue} accessibilityLiveRegion="polite">
        {value}
      </Txt>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} +1`}
        disabled={value >= max}
        onPress={() => {
          tapLight();
          onChange(Math.min(max, value + 1));
        }}
        style={[styles.stepBtn, value >= max && { opacity: 0.4 }]}
      >
        <Icon name="plus" />
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
export function ListRow({ icon, label, value, onPress, danger }: { icon?: IconName; label: string; value?: string; onPress?: () => void; danger?: boolean }) {
  const color = danger ? colors.alert : colors.ink;
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.listRow, pressed && { backgroundColor: colors.mintSoft }]}>
      {icon ? <Icon name={icon} color={color} size={22} /> : null}
      <Txt style={styles.grow} color={color}>
        {label}
      </Txt>
      {value ? (
        <Txt variant="small" color={colors.muted}>
          {value}
        </Txt>
      ) : null}
      {onPress ? <Icon name="chevron" size={18} color={colors.muted} /> : null}
    </Pressable>
  );
}

/** Champ texte aux couleurs PlushUp (police selon la langue, alignement RTL). */
export function Field(props: TextInputProps & { label?: string }) {
  const locale = useApp((s) => s.locale);
  const { label, style, ...rest } = props;
  return (
    <View style={{ gap: space.xs }}>
      {label ? (
        <Txt variant="small" weight="semibold">
          {label}
        </Txt>
      ) : null}
      <TextInput
        placeholderTextColor={colors.muted}
        // Le libellé visible sert aussi de nom accessible (lecteurs d'écran, tests).
        accessibilityLabel={rest.accessibilityLabel ?? label}
        {...rest}
        style={[styles.input, { fontFamily: fontFamily(locale, 'regular'), textAlign: locale === 'ar' ? 'right' : 'left' }, style]}
      />
    </View>
  );
}

export const Divider = () => <View style={styles.divider} />;

/** Confirmation multiplateforme (Alert.alert ne fait rien sur le web). */
export function confirm(message: string, okLabel: string, cancelLabel: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(typeof window !== 'undefined' && window.confirm(message));
  return new Promise((resolve) =>
    Alert.alert('PlushUp', message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      { text: okLabel, style: 'destructive', onPress: () => resolve(true) },
    ]),
  );
}

export function notify(message: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(message);
  } else Alert.alert('PlushUp', message);
}

export const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1 },
  pad: { paddingHorizontal: space.lg },
  scrollContent: { paddingHorizontal: space.lg, paddingBottom: space.xxl, flexGrow: 1 },
  column: { width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' },
  footer: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.md, backgroundColor: colors.cream, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm, minHeight: touch + 8 },
  headerTitle: { flex: 1, textAlign: 'center' },
  iconBtn: { width: touch, height: touch, alignItems: 'center', justifyContent: 'center' },
  headerRight: { minWidth: touch, height: touch, alignItems: 'flex-end', justifyContent: 'center' },
  card: { borderRadius: radius.lg, padding: space.lg, gap: space.md },
  section: { gap: space.md, marginTop: space.xl },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  button: {
    minHeight: touch + 4,
    borderRadius: radius.pill,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    borderWidth: 1.5,
  },
  buttonSmall: { minHeight: 40, paddingHorizontal: space.lg },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { minHeight: touch, paddingHorizontal: space.lg, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  chipOn: { backgroundColor: colors.deep, borderColor: colors.deep },
  chipOff: { backgroundColor: colors.white, borderColor: colors.line },
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: space.xs },
  scaleItem: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 64,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.line,
  },
  scaleItemOn: { backgroundColor: colors.mint, borderColor: colors.deep },
  face: { fontSize: 28, lineHeight: 36 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: space.lg, alignSelf: 'flex-start' },
  stepBtn: { width: touch, height: touch, borderRadius: touch / 2, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  stepValue: { minWidth: 40, textAlign: 'center' },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: touch + 8, paddingHorizontal: space.md, borderRadius: radius.sm },
  input: {
    minHeight: touch + 4,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    fontSize: 16, // ≥ 16 : évite le zoom automatique d'iOS Safari sur le champ.
    color: colors.ink,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginHorizontal: space.md },
});
