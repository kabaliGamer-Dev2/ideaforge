export const SKILL_POOL = [
  "React", "JavaScript", "TypeScript", "HTML/CSS", "Tailwind", "Node.js", "Express", "Next.js",
  "Python", "Django", "Flask", "Java", "C++", "C#", "Go", "Rust", "PHP", "SQL", "PostgreSQL",
  "MongoDB", "Firebase", "Git", "Docker", "Linux", "AWS", "GCP", "Azure", "Machine Learning",
  "TensorFlow", "PyTorch", "scikit-learn", "NumPy", "Computer Vision", "NLP", "LLMs", "Data Analysis",
  "Power BI", "Tableau", "Flutter", "Android", "Kotlin", "Swift", "GraphQL", "Redux", "APIs",
  "Testing", "UI/UX", "Figma", "Arduino", "IoT", "REST APIs", "WebSockets", "Redis", "Pandas",
];

export const INTEREST_POOL = [
  "healthcare", "education", "agriculture", "finance", "logistics", "sustainability",
  "accessibility", "civic data", "retail", "campus operations", "computer vision", "NLP",
  "IoT", "gaming", "music", "sports", "travel", "real estate", "e-commerce", "fintech",
  "edtech", "healthtech", "AI ethics", "robotics", "AR/VR", "blockchain", "climate",
  "food tech", "media", "social good",
];

export function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length > 0) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}