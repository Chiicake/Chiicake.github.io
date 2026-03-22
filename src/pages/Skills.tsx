import { Binary, Bot, Boxes, Database } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StaggeredList } from '../components/animations/StaggeredList';
import { Card } from '../components/ui/Card';
import { SectionTitle } from '../components/ui/SectionTitle';

interface SkillItem {
  label: string;
  tier: 'core' | 'secondary';
}

interface SkillGroup {
  code: string;
  title: string;
  items: SkillItem[];
}

interface SkillsRegistryProps {
  className?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function SkillsRegistry({ className }: SkillsRegistryProps) {
  const { t, i18n } = useTranslation();
  const bundle = i18n.getResourceBundle(i18n.language, 'translation') as Record<string, unknown> | undefined;
  const skillsBundle = isRecord(bundle?.skills) ? bundle.skills : {};
  const groupsRaw = Array.isArray(skillsBundle.groups) ? skillsBundle.groups : [];

  const groups: SkillGroup[] = groupsRaw
    .filter(isRecord)
    .map((entry) => ({
      code: isString(entry.code) ? entry.code : '',
      title: isString(entry.title) ? entry.title : '',
      items: Array.isArray(entry.items)
        ? entry.items
            .filter(isRecord)
            .map((item) => ({
              label: isString(item.label) ? item.label : '',
              tier: (item.tier === 'secondary' ? 'secondary' : 'core') as SkillItem['tier'],
            }))
            .filter((item) => item.label)
        : [],
    }))
    .filter((group) => group.code && group.title && group.items.length > 0);

  const icons = [Binary, Boxes, Database, Bot];

  return (
    <div className={className}>
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <span className="engineering-kicker">{t('skills.legendLabel')}</span>
        <span className="skill-registry-pill is-core">{t('skills.coreLabel')}</span>
        <span className="skill-registry-pill is-secondary">{t('skills.secondaryLabel')}</span>
      </div>

      <StaggeredList className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {groups.map((group, index) => {
          const Icon = icons[index % icons.length];
          const coreCount = group.items.filter((item) => item.tier === 'core').length;

          return (
            <Card
              key={group.code}
              hoverable
              className="engineering-panel skill-registry-panel border-gray-200/80 bg-transparent shadow-[0_18px_55px_rgba(15,23,42,0.05)] dark:border-slate-800/70"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="engineering-kicker mb-2">{group.code}</p>
                  <h3 className="text-lg font-black tracking-tight text-[var(--color-text-primary)] sm:text-xl">
                    {group.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="mono-data rounded-full border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/8 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-[var(--color-accent)]">
                    {coreCount} {t('skills.coreCountSuffix')}
                  </span>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent)]/12 text-[var(--color-accent)]">
                    <Icon size={16} />
                  </div>
                </div>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                {group.items.map((item) => (
                  <div
                    key={`${group.code}-${item.label}`}
                    className={`skill-registry-entry${item.tier === 'secondary' ? ' is-secondary' : ' is-core'}`}
                  >
                    <span className="skill-registry-entry__marker" aria-hidden="true" />
                    <span className="skill-registry-entry__label">{item.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </StaggeredList>
    </div>
  );
}

export default function Skills({ id }: { id?: string }) {
  const { t } = useTranslation();

  return (
    <section id={id} className="scroll-mt-20">
      <div className="py-12">
        <header>
          <h1 className="sr-only">{t('skills.title')}</h1>
          <SectionTitle title={t('skills.title')} />
        </header>
        <SkillsRegistry className="mt-8" />
      </div>
    </section>
  );
}
