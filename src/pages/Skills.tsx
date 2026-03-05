import { useTranslation } from 'react-i18next';
import { SectionTitle } from '../components/ui/SectionTitle';
import { Card } from '../components/ui/Card';
import { StaggeredList } from '../components/animations/StaggeredList';

export default function Skills() {
  const { t } = useTranslation();

  const skillCategories = [
    {
      title: t('skills.categories.languages'),
      skills: [
        { name: t('skills.items.rust'), level: 92 },
        { name: t('skills.items.go'), level: 90 },
        { name: t('skills.items.java'), level: 88 }
      ]
    },
    {
      title: t('skills.categories.backend'),
      skills: [
        { name: t('skills.items.api'), level: 90 },
        { name: t('skills.items.database'), level: 86 }
      ]
    },
    {
      title: t('skills.categories.platform'),
      skills: [
        { name: t('skills.items.container'), level: 84 },
        { name: t('skills.items.cicd'), level: 82 }
      ]
    }
  ];

  return (
    <div className="py-12">
      <SectionTitle title={t('skills.title')} />

      <StaggeredList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
        {skillCategories.map((category, idx) => (
          <Card key={idx} hoverable className="h-full">
            <h3 className="text-xl font-bold mb-6 text-[var(--color-text-primary)]">
              {category.title}
            </h3>
            <div className="space-y-6">
              {category.skills.map((skill, skillIdx) => (
                <div key={skillIdx}>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-[var(--color-text-primary)]">{skill.name}</span>
                    <span className="text-[var(--color-text-secondary)] text-sm">{skill.level}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </StaggeredList>
    </div>
  );
}
