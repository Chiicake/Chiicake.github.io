import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { HomeCliHero } from '../components/home/HomeCliHero';

export default function CliHome() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const cliShortcuts = [
    {
      command: '$ open /blog',
      label: t('hero.ctaBlog'),
      href: '/blog',
    },
    {
      command: '$ jump #projects',
      label: t('hero.ctaPrimary'),
      onClick: () => navigate('/home', { state: { scrollTo: 'projects' } }),
    },
    {
      command: '$ jump #about',
      label: t('nav.about'),
      onClick: () => navigate('/home', { state: { scrollTo: 'about' } }),
    },
    {
      command: '$ xdg-open github.com/Chiicake',
      label: t('hero.ctaGithub'),
      href: 'https://github.com/Chiicake',
      external: true,
    },
    {
      command: '$ jump #contact',
      label: t('hero.ctaSecondary'),
      onClick: () => navigate('/home', { state: { scrollTo: 'contact' } }),
    },
  ];

  return <HomeCliHero shortcuts={cliShortcuts} />;
}
