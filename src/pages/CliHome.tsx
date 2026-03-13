import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { HomeCliHero } from '../components/home/HomeCliHero';

export default function CliHome() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const cliShortcuts = [
    {
      command: 'open /blog',
      label: t('hero.ctaBlog'),
      href: '/blog',
    },
    {
      command: 'open /projects',
      label: t('hero.ctaPrimary'),
      onClick: () => navigate('/projects'),
    },
    {
      command: 'open /about',
      label: t('nav.about'),
      onClick: () => navigate('/about'),
    },
    {
      command: 'xdg-open github.com/Chiicake',
      label: t('hero.ctaGithub'),
      href: 'https://github.com/Chiicake',
      external: true,
    },
  ];

  return <HomeCliHero shortcuts={cliShortcuts} />;
}
