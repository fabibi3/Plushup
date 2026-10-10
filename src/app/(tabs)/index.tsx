// Accueil « Aujourd'hui » : tout ce qui compte en un écran, 1 tap par action.
import { Link, router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { DemoBanner } from '@/components/DemoBanner';
import { Icon } from '@/components/Icon';
import { ProductImage } from '@/components/ProductImage';
import { Txt } from '@/components/Txt';
import { WaveBand, WaveMark } from '@/components/Wave';
import { Button, Card, Screen } from '@/components/ui';
import { getFiche, tipOfTheDay } from '@/content/fiches';
import { dayDurationSec, getDay, PROGRAM_LENGTH } from '@/content/program';
import { fmt, useT } from '@/i18n';
import { diffDays, formatLongDate } from '@/lib/dates';
import { success } from '@/lib/haptics';
import { activeDays, dayCompletedOn, hasCheckin, nextProgramDay, streak, weekActivity } from '@/lib/stats';
import { requestSync } from '@/lib/cloud';
import { useToday } from '@/lib/useToday';
import { useApp } from '@/store/useApp';
import { colors, radius, space } from '@/theme/tokens';

export default function Today() {
  const t = useT();
  const today = useToday();
  const locale = useApp((s) => s.locale);
  const firstName = useApp((s) => s.profile.firstName);
  const onboardedAt = useApp((s) => s.profile.onboardedAt);
  const logs = useApp((s) => s.logs);
  const completions = useApp((s) => s.completions);
  const addWater = useApp((s) => s.addWater);
  const linkedOrder = useApp((s) => s.linkedOrder);

  const log = logs[today];
  const checked = hasCheckin(log);

  const { currentStreak, week, nextDay, todayDay } = useMemo(() => {
    const active = activeDays(logs, completions);
    return {
      currentStreak: streak(active, today),
      week: weekActivity(active, today),
      nextDay: nextProgramDay(completions, PROGRAM_LENGTH),
      todayDay: dayCompletedOn(completions, today),
    };
  }, [logs, completions, today]);
  const doneToday = todayDay != null;

  const daysSinceStart = onboardedAt ? diffDays(onboardedAt.slice(0, 10), today) : 0;
  const tip = tipOfTheDay(daysSinceStart);
  const tipFiche = tip.fiche ? getFiche(tip.fiche) : undefined;
  // Routine faite aujourd'hui → on montre CELLE-CI (« La refaire ») ; sinon la prochaine à faire.
  const program = todayDay ? getDay(todayDay) : nextDay ? getDay(nextDay) : undefined;
  const activeCount = week.filter((d) => d.active).length;
  const routinesDone = Object.keys(completions).length;
  // Le bilan apparaît dès qu'il y a de quoi raconter ; la carte commerce une fois l'habitude installée.
  const showWeekly = Object.keys(logs).length >= 3;
  const showOrder = linkedOrder != null || routinesDone >= 7;

  const onWater = () => {
    addWater(today, 1);
    success();
    requestSync();
  };

  return (
    <Screen>
      {/* En-tête */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.lg }}>
        <View style={{ flex: 1 }}>
          <Txt variant="caption" color={colors.muted}>
            {formatLongDate(today, t.days.long, t.months)}
          </Txt>
          <Txt variant="title" numberOfLines={1}>
            {firstName ? fmt(t.today.hello, { name: firstName }) : t.today.helloAnon}
          </Txt>
        </View>
        <WaveMark size={44} />
      </View>
      <DemoBanner />

      {/* Série + semaine */}
      <Card tone="deep" style={{ marginTop: space.lg, paddingBottom: 0, overflow: 'hidden' }}>
        <Txt variant="h2" color={colors.white}>
          {currentStreak > 0 ? fmt(t.today.streak, { n: currentStreak }) : t.today.streakZero}
        </Txt>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {week.map((d, i) => (
            <View key={d.key} style={{ alignItems: 'center', gap: space.xs }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: d.active ? colors.mint : 'transparent',
                  borderWidth: 2,
                  borderColor: d.key === today ? colors.white : d.active ? colors.mint : colors.teal,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: d.future ? 0.5 : 1,
                }}
              >
                {d.active ? <Icon name="check" size={16} color={colors.deep} strokeWidth={3} /> : null}
              </View>
              <Txt variant="caption" color={colors.mint}>
                {t.days.short[i]}
              </Txt>
            </View>
          ))}
        </View>
        <Txt variant="small" color={colors.mint}>
          {fmt(t.today.weekActive, { n: activeCount })}
        </Txt>
        <WaveBand color={colors.teal} height={22} style={{ marginHorizontal: -space.lg }} />
      </Card>

      {/* Check-in */}
      <Card style={{ marginTop: space.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Txt variant="h2">{t.today.checkinTitle}</Txt>
          {checked ? <Badge label={t.today.checkinDone} /> : null}
        </View>
        {checked && log ? (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
              <Pill text={`${t.checkin.heaviness} : ${t.checkin.heavinessLabels[log.heaviness ?? 0]}`} />
              {log.wornHours != null ? <Pill text={`🩱 ${log.wornHours > 0 ? fmt(t.checkin.hours, { n: log.wornHours }) : t.checkin.notWorn}`} /> : null}
            </View>
            <Button label={t.common.edit} variant="secondary" small onPress={() => router.push('/checkin')} />
          </>
        ) : (
          <Button label={t.today.checkinCta} onPress={() => router.push('/checkin')} />
        )}
      </Card>

      {/* Routine du jour */}
      <Card tone="mint" style={{ marginTop: space.lg }}>
        <Txt variant="h2">{t.today.routineTitle}</Txt>
        {program ? (
          <>
            <View style={{ gap: 2 }}>
              <Txt variant="caption" color={colors.muted}>
                {fmt(t.today.routineDay, { day: program.day, total: PROGRAM_LENGTH })} · {fmt(t.common.minutes, { n: Math.round(dayDurationSec(program) / 60) })}
              </Txt>
              <Txt weight="semibold">{program.title[locale]}</Txt>
            </View>
            {doneToday ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                <Icon name="check" color={colors.teal} />
                <Txt color={colors.teal} weight="semibold" style={{ flex: 1 }}>
                  {t.today.routineDone}
                </Txt>
                <Button label={t.today.routineAgain} variant="ghost" small onPress={() => router.push(`/routine/${program.day}`)} />
              </View>
            ) : (
              <Button label={t.common.start} icon="play" onPress={() => router.push(`/routine/${program.day}`)} />
            )}
          </>
        ) : (
          <Txt>{t.today.programDone}</Txt>
        )}
      </Card>

      {/* Hydratation */}
      <Card style={{ marginTop: space.lg, flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.mintSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="drop" color={colors.teal} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt weight="semibold">{t.today.waterTitle}</Txt>
          <Txt variant="small" color={colors.muted}>
            {fmt(t.today.waterCount, { n: log?.water ?? 0 })}
          </Txt>
        </View>
        <Button label={t.today.waterAdd} variant="secondary" small onPress={onWater} />
      </Card>

      {/* Conseil du jour */}
      <Card tone="sand" style={{ marginTop: space.lg }}>
        <Txt variant="caption" color={colors.muted}>
          {t.today.tipTitle}
        </Txt>
        <Txt>{tip.text[locale]}</Txt>
        {tipFiche ? (
          <Link href={`/fiche/${tipFiche.slug}`} asChild>
            <Pressable accessibilityRole="link" style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs, minHeight: 32 }}>
              <Txt variant="small" weight="semibold" color={colors.teal}>
                {t.today.readMore}
              </Txt>
              <Icon name="chevron" size={16} color={colors.teal} />
            </Pressable>
          </Link>
        ) : null}
      </Card>

      {/* Bilan de la semaine */}
      {showWeekly ? (
        <Pressable accessibilityRole="button" onPress={() => router.push('/bilan')} style={{ marginTop: space.lg }}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <Txt style={{ fontSize: 28, lineHeight: 36 }}>📊</Txt>
            <View style={{ flex: 1 }}>
              <Txt weight="semibold">{t.weekly.cardTitle}</Txt>
              <Txt variant="small" color={colors.muted}>
                {fmt(t.today.weekActive, { n: activeCount })}
              </Txt>
            </View>
            <Icon name="chevron" size={18} color={colors.muted} />
          </Card>
        </Pressable>
      ) : null}

      {/* Commerce : réachat au bon moment */}
      {showOrder ? (
        <Pressable accessibilityRole="button" onPress={() => router.push('/commande')} style={{ marginTop: space.lg }}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <ProductImage size={56} />
            <View style={{ flex: 1 }}>
              <Txt weight="semibold">{t.order.reorderTitle}</Txt>
              <Txt variant="small" color={colors.muted} numberOfLines={2}>
                {t.order.reorderBody}
              </Txt>
            </View>
            <Icon name="chevron" size={18} color={colors.muted} />
          </Card>
        </Pressable>
      ) : null}
    </Screen>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.mintSoft, paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: radius.pill }}>
      <Icon name="check" size={14} color={colors.teal} strokeWidth={3} />
      <Txt variant="caption" color={colors.teal}>
        {label}
      </Txt>
    </View>
  );
}

function Pill({ text }: { text: string }) {
  return (
    <View style={{ backgroundColor: colors.cream, paddingHorizontal: space.md, paddingVertical: 6, borderRadius: radius.pill }}>
      <Txt variant="small">{text}</Txt>
    </View>
  );
}
