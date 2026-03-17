/**
 * Dataset représentatif : profils étudiants et missions entreprise.
 * Utilisé par le sandbox matching étudiants ↔ missions.
 */

export interface Mission {
  missionId: string;
  title: string;
  description: string;
  sector: string;
  skills: string[];
  cities: string[];
  companyId: string;
  type: "stage" | "alternance" | "freelance";
}

export interface Profile {
  profileId: string;
  school: string;
  major: string;
  skills: string[];
  interests: string[];
  cities: string[];
  level: "L3" | "M1" | "M2" | "ingénieur";
}

export const missions: Mission[] = [
  {
    missionId: "m1",
    title: "Stage Développeur Full-Stack",
    description:
      "Développement d'applications web React et Node.js, participation aux cérémonies agile, pair programming.",
    sector: "Tech",
    skills: ["React", "Node.js", "TypeScript", "PostgreSQL"],
    cities: ["Lyon", "Paris"],
    companyId: "c1",
    type: "stage",
  },
  {
    missionId: "m2",
    title: "Alternance Data Science",
    description:
      "Machine learning, analyse de données, pipelines ETL. Environnement Python, PyTorch, SQL.",
    sector: "Tech",
    skills: ["Python", "Machine Learning", "SQL", "PyTorch"],
    cities: ["Paris"],
    companyId: "c1",
    type: "alternance",
  },
  {
    missionId: "m3",
    title: "Stage Marketing Digital",
    description: "Community management, stratégie réseaux sociaux, création de contenu, analytics.",
    sector: "Marketing",
    skills: ["Social media", "Content", "Analytics", "SEO"],
    cities: ["Lyon", "Bordeaux"],
    companyId: "c2",
    type: "stage",
  },
  {
    missionId: "m4",
    title: "Mission Freelance UX/UI",
    description: "Conception d'interfaces, wireframes, prototypes Figma, design system.",
    sector: "Design",
    skills: ["Figma", "UX", "UI", "Design system"],
    cities: ["Paris", "Remote"],
    companyId: "c3",
    type: "freelance",
  },
  {
    missionId: "m5",
    title: "Stage Développeur Mobile",
    description: "Développement d'applications iOS et Android avec React Native.",
    sector: "Tech",
    skills: ["React Native", "TypeScript", "iOS", "Android"],
    cities: ["Lyon"],
    companyId: "c4",
    type: "stage",
  },
  {
    missionId: "m6",
    title: "Alternance Business Developer",
    description: "Prospection B2B, négociation commerciale, CRM Salesforce.",
    sector: "Commerce",
    skills: ["Prospection", "CRM", "Salesforce", "Négociation"],
    cities: ["Paris", "Lyon"],
    companyId: "c5",
    type: "alternance",
  },
  {
    missionId: "m7",
    title: "Stage DevOps / SRE",
    description: "CI/CD, Kubernetes, Terraform, monitoring et observabilité.",
    sector: "Tech",
    skills: ["Kubernetes", "Terraform", "CI/CD", "Docker"],
    cities: ["Paris"],
    companyId: "c1",
    type: "stage",
  },
  {
    missionId: "m8",
    title: "Mission Rédaction Web",
    description: "Rédaction SEO, articles de blog, fiches produits pour e-commerce.",
    sector: "Marketing",
    skills: ["Rédaction", "SEO", "Content marketing"],
    cities: ["Remote"],
    companyId: "c2",
    type: "freelance",
  },
];

export const profiles: Profile[] = [
  {
    profileId: "p1",
    school: "Centrale Lyon",
    major: "Informatique",
    skills: ["React", "TypeScript", "Node.js", "PostgreSQL"],
    interests: ["Web", "Startup", "Full-Stack"],
    cities: ["Lyon"],
    level: "M1",
  },
  {
    profileId: "p2",
    school: "Sciences Po Paris",
    major: "Communication",
    skills: ["Social media", "Rédaction", "Analytics"],
    interests: ["Marketing", "Influence", "Brand"],
    cities: ["Paris", "Lyon"],
    level: "M2",
  },
  {
    profileId: "p3",
    school: "Polytechnique",
    major: "Mathématiques appliquées",
    skills: ["Python", "Machine Learning", "SQL", "PyTorch"],
    interests: ["Data Science", "AI", "Research"],
    cities: ["Paris"],
    level: "M2",
  },
  {
    profileId: "p4",
    school: "Gobelins",
    major: "Design graphique",
    skills: ["Figma", "UX", "UI", "Illustration"],
    interests: ["Product design", "Design system"],
    cities: ["Paris"],
    level: "M1",
  },
  {
    profileId: "p5",
    school: "INSA Lyon",
    major: "Informatique",
    skills: ["React Native", "TypeScript", "Firebase"],
    interests: ["Mobile", "Cross-platform"],
    cities: ["Lyon"],
    level: "M1",
  },
  {
    profileId: "p6",
    school: "HEC Paris",
    major: "Management",
    skills: ["Excel", "CRM", "Prospection", "Négociation"],
    interests: ["Sales", "Business development"],
    cities: ["Paris"],
    level: "M2",
  },
  {
    profileId: "p7",
    school: "EPITA",
    major: "Systèmes et réseaux",
    skills: ["Docker", "Kubernetes", "Terraform", "Linux"],
    interests: ["DevOps", "Cloud", "Infrastructure"],
    cities: ["Paris"],
    level: "M2",
  },
  {
    profileId: "p8",
    school: "CELSA",
    major: "Journalisme",
    skills: ["Rédaction", "SEO", "Content strategy"],
    interests: ["Édition", "Médias", "Web"],
    cities: ["Paris", "Remote"],
    level: "M1",
  },
  {
    profileId: "p9",
    school: "42 Lyon",
    major: "Développement",
    skills: ["C", "Python", "SQL", "Docker"],
    interests: ["Backend", "Systems"],
    cities: ["Lyon"],
    level: "ingénieur",
  },
  {
    profileId: "p10",
    school: "ESSEC",
    major: "Marketing digital",
    skills: ["Google Analytics", "Meta Ads", "Content", "SEO"],
    interests: ["Growth", "Performance marketing"],
    cities: ["Paris", "Bordeaux"],
    level: "M2",
  },
];
