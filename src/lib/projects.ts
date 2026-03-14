interface ProjectModule {
  name: string;
  description: string;
}

interface ProjectDiagnostic {
  label: string;
  value: string;
}

interface ProjectMetric {
  key: string;
  label: string;
  value: string;
}

interface FeaturedProjectSummary {
  eyebrow: string;
  title: string;
  status: string;
  path: string;
  tagline: string;
  summary: string;
  stackLabel: string;
  stack: string[];
  metrics: ProjectMetric[];
  repoCta: string;
  detailCta: string;
  sourceHref: string;
}

interface SecondaryProject {
  title: string;
  path: string;
  summary: string;
  href: string;
  stack: string[];
}

interface FeaturedProjectDetail {
  eyebrow: string;
  title: string;
  terminalLabel: string;
  status: string;
  introLabel: string;
  focusLabel: string;
  modulesLabel: string;
  diagnosticsLabel: string;
  stackLabel: string;
  sourceCta: string;
  backCta: string;
  path: string;
  tagline: string;
  summary: string;
  highlights: string[];
  modules: ProjectModule[];
  diagnostics: ProjectDiagnostic[];
  metrics: ProjectMetric[];
  stack: string[];
  sourceHref: string;
  flowLabel: string;
  flowHint: string;
  flowNodes: string[];
}

export interface ProjectsContent {
  title: string;
  secondaryLabel: string;
  secondaryHint: string;
  allReposCta: string;
  githubHref: string;
  featuredProject: FeaturedProjectSummary;
  featuredProjectDetail: FeaturedProjectDetail;
  secondaryProjects: SecondaryProject[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function parseStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter(isString) : [];
}

function parseMetrics(value: unknown): ProjectMetric[] {
  return (Array.isArray(value) ? value : [])
    .filter(isRecord)
    .map((metric) => ({
      key: isString(metric.key) ? metric.key : '',
      label: isString(metric.label) ? metric.label : '',
      value: isString(metric.value) ? metric.value : '',
    }))
    .filter((metric) => metric.key && metric.label && metric.value);
}

function parseModules(value: unknown): ProjectModule[] {
  return (Array.isArray(value) ? value : [])
    .filter(isRecord)
    .map((module) => ({
      name: isString(module.name) ? module.name : '',
      description: isString(module.description) ? module.description : '',
    }))
    .filter((module) => module.name && module.description);
}

function parseDiagnostics(value: unknown): ProjectDiagnostic[] {
  return (Array.isArray(value) ? value : [])
    .filter(isRecord)
    .map((diagnostic) => ({
      label: isString(diagnostic.label) ? diagnostic.label : '',
      value: isString(diagnostic.value) ? diagnostic.value : '',
    }))
    .filter((diagnostic) => diagnostic.label && diagnostic.value);
}

function parseSecondaryProjects(value: unknown): SecondaryProject[] {
  return (Array.isArray(value) ? value : [])
    .filter(isRecord)
    .map((project) => ({
      title: isString(project.title) ? project.title : '',
      path: isString(project.path) ? project.path : '',
      summary: isString(project.summary) ? project.summary : '',
      href: isString(project.href) ? project.href : '',
      stack: parseStringArray(project.stack),
    }))
    .filter((project) => project.title && project.path && project.summary && project.href);
}

export function getProjectsContent(bundle: Record<string, unknown> | undefined): ProjectsContent {
  const projectsBundle = isRecord(bundle?.projects) ? bundle.projects : {};
  const featuredProject = isRecord(projectsBundle.featuredProject) ? projectsBundle.featuredProject : {};
  const detailPage = isRecord(projectsBundle.detailPage) ? projectsBundle.detailPage : {};

  return {
    title: isString(projectsBundle.title) ? projectsBundle.title : '',
    secondaryLabel: isString(projectsBundle.secondaryLabel) ? projectsBundle.secondaryLabel : '',
    secondaryHint: isString(projectsBundle.secondaryHint) ? projectsBundle.secondaryHint : '',
    allReposCta: isString(projectsBundle.allReposCta) ? projectsBundle.allReposCta : '',
    githubHref: isString(projectsBundle.githubHref) ? projectsBundle.githubHref : 'https://github.com/Chiicake?tab=repositories',
    featuredProject: {
      eyebrow: isString(featuredProject.eyebrow) ? featuredProject.eyebrow : '',
      title: isString(featuredProject.title) ? featuredProject.title : '',
      status: isString(featuredProject.status) ? featuredProject.status : '',
      path: isString(featuredProject.path) ? featuredProject.path : '',
      tagline: isString(featuredProject.tagline) ? featuredProject.tagline : '',
      summary: isString(featuredProject.summary) ? featuredProject.summary : '',
      stackLabel: isString(featuredProject.stackLabel) ? featuredProject.stackLabel : '',
      stack: parseStringArray(featuredProject.stack),
      metrics: parseMetrics(featuredProject.metrics),
      repoCta: isString(featuredProject.repoCta) ? featuredProject.repoCta : '',
      detailCta: isString(featuredProject.detailCta) ? featuredProject.detailCta : '',
      sourceHref: isString(featuredProject.sourceHref) ? featuredProject.sourceHref : '',
    },
    featuredProjectDetail: {
      eyebrow: isString(detailPage.eyebrow) ? detailPage.eyebrow : '',
      title: isString(detailPage.title) ? detailPage.title : '',
      terminalLabel: isString(detailPage.terminalLabel) ? detailPage.terminalLabel : '',
      status: isString(detailPage.status) ? detailPage.status : '',
      introLabel: isString(detailPage.introLabel) ? detailPage.introLabel : '',
      focusLabel: isString(detailPage.focusLabel) ? detailPage.focusLabel : '',
      modulesLabel: isString(detailPage.modulesLabel) ? detailPage.modulesLabel : '',
      diagnosticsLabel: isString(detailPage.diagnosticsLabel) ? detailPage.diagnosticsLabel : '',
      stackLabel: isString(detailPage.stackLabel) ? detailPage.stackLabel : '',
      sourceCta: isString(detailPage.sourceCta) ? detailPage.sourceCta : '',
      backCta: isString(detailPage.backCta) ? detailPage.backCta : '',
      path: isString(detailPage.path) ? detailPage.path : '',
      tagline: isString(detailPage.tagline) ? detailPage.tagline : '',
      summary: isString(detailPage.summary) ? detailPage.summary : '',
      highlights: parseStringArray(detailPage.highlights),
      modules: parseModules(detailPage.modules),
      diagnostics: parseDiagnostics(detailPage.diagnostics),
      metrics: parseMetrics(detailPage.metrics),
      stack: parseStringArray(detailPage.stack),
      sourceHref: isString(detailPage.sourceHref) ? detailPage.sourceHref : '',
      flowLabel: isString(detailPage.flowLabel) ? detailPage.flowLabel : '',
      flowHint: isString(detailPage.flowHint) ? detailPage.flowHint : '',
      flowNodes: parseStringArray(detailPage.flowNodes),
    },
    secondaryProjects: parseSecondaryProjects(projectsBundle.secondaryProjects),
  };
}
