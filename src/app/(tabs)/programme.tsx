import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Txt } from '@/components/Txt';
import { WaveProgress } from '@/components/Wave';
import { Card, Screen, Section } from '@/components/ui';
import { FICHES } from '@/content/fiches';
import { dayDurationSec, PROGRAM, PROGRAM_LENGTH } from '@/content/program';
import { fmt, useT } from '@/i18n';
import { nextProgramDay } from '@/lib/stats';
import { useApp } from '@/store/useApp';
import { colors, radius, space } from '@/theme/tokens';

export default function Programme() {
  const t = useT();
  const locale = useApp((s) => s.locale);
  const completions = useApp((s) => s.completions);
  const done = Object.keys(completions).length;
  const next = nextProgramDay(completions, PROGRAM_LENGTH);

  return (
    <Screen>
      <View style={{ marginTop: space.lg, gap: space.sm }}>
        <Txt variant="title">{t.program.title}</Txt>
        <Txt color={colors.muted}>{t.program.subtitle}</Txt>
      </View>

      <Card style={{ marginTop: space.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Txt weight="semibold">{fmt(t.program.progress, { done, total: PROGRAM_LENGTH })}</Txt>
        </View>
        <WaveProgress value={done / PROGRAM_LENGTH} />
      </Card>

      {[0, 1, 2].map((week) => (
        <Section key={week} title={`${fmt(t.program.week, { n: week + 1 })} · ${t.program.weekThemes[week]}`}>
          <View style={{ gap: space.sm }}>
            {PROGRAM.slice(week * 7, week * 7 + 7).map((day) => {
              const isDone = completions[day.day] != null;
              const isNext = day.day === next;
              return (
                <Link key={day.day} href={`/routine/${day.day}`} asChild>
                  <Pressable
                    accessibilityRole="button"
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: space.md,
                      padding: space.md,
                      borderRadius: radius.md,
                      backgroundColor: isNext ? colors.mintSoft : colors.white,
                      borderWidth: isNext ? 2 : 0,
                      borderColor: colors.deep,
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isDone ? colors.deep : colors.cream,
                      }}
                    >
                      {isDone ? (
                        <Icon name="check" size={20} color={colors.white} strokeWidth={3} />
                      ) : (
                        <Txt weight="bold">{day.day}</Txt>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Txt weight="semibold">{day.title[locale]}</Txt>
                      <Txt variant="small" color={colors.muted}>
                        {isNext ? `${t.program.today} · ` : ''}
                        {fmt(t.common.minutes, { n: Math.round(dayDurationSec(day) / 60) })}
                      </Txt>
                    </View>
                    <Icon name="chevron" size={18} color={colors.muted} />
                  </Pressable>
                </Link>
              );
            })}
          </View>
        </Section>
      ))}

      <Section title={t.program.readTitle}>
        <View style={{ gap: space.sm }}>
          {FICHES.map((f) => (
            <Link key={f.slug} href={`/fiche/${f.slug}`} asChild>
              <Pressable
                accessibilityRole="link"
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.md,
                  padding: space.md,
                  borderRadius: radius.md,
                  backgroundColor: colors.white,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Txt style={{ fontSize: 24, lineHeight: 32 }}>{f.emoji}</Txt>
                <View style={{ flex: 1 }}>
                  <Txt weight="semibold">{f.title[locale]}</Txt>
                  <Txt variant="small" color={colors.muted}>
                    {fmt(t.fiches.minutes, { n: f.minutes })}
                  </Txt>
                </View>
                <Icon name="chevron" size={18} color={colors.muted} />
              </Pressable>
            </Link>
          ))}
        </View>
      </Section>
    </Screen>
  );
}
