/** Official brand icons for languages, frameworks, databases & ORMs via react-icons. */

import type { ReactNode } from 'react';
import {
  SiPhp,
  SiTypescript,
  SiGo,
  SiPython,
  SiRust,
  SiLaravel,
  SiSymfony,
  SiNestjs,
  SiExpress,
  SiFastify,
  SiFastapi,
  SiDjango,
  SiFlask,
  SiSpringboot,
  SiQuarkus,
  SiPostgresql,
  SiMysql,
  SiMongodb,
  SiRedis,
  SiSqlite,
  SiPrisma,
  SiDrizzle,
  SiHibernate,
  SiDoctrine,
  SiSqlalchemy,
  SiTypeorm,
  SiClaude,
  SiOpenai,
  SiGooglegemini,
} from 'react-icons/si';
import { FaJava } from 'react-icons/fa';

const TECH_ICONS: Record<string, ReactNode> = {
  // Languages
  php: <SiPhp />,
  typescript: <SiTypescript />,
  go: <SiGo />,
  python: <SiPython />,
  java: <FaJava />,
  rust: <SiRust />,
  // Frameworks
  laravel: <SiLaravel />,
  symfony: <SiSymfony />,
  nestjs: <SiNestjs />,
  express: <SiExpress />,
  fastify: <SiFastify />,
  fastapi: <SiFastapi />,
  django: <SiDjango />,
  flask: <SiFlask />,
  spring: <SiSpringboot />,
  quarkus: <SiQuarkus />,
  // Databases
  postgresql: <SiPostgresql />,
  mysql: <SiMysql />,
  mongodb: <SiMongodb />,
  redis: <SiRedis />,
  sqlite: <SiSqlite />,
  // ORMs / Connectors
  prisma: <SiPrisma />,
  typeorm: <SiTypeorm />,
  drizzle: <SiDrizzle />,
  sqlalchemy: <SiSqlalchemy />,
  'django-orm': <SiDjango />,
  doctrine: <SiDoctrine />,
  hibernate: <SiHibernate />,
  // LLM Providers
  claude: <SiClaude />,
  openai: <SiOpenai />,
  gemini: <SiGooglegemini />,
};

/** Returns the official SVG icon for a tech id, or null if unavailable. */
export function getTechIcon(id: string): ReactNode | null {
  return TECH_ICONS[id] ?? null;
}
