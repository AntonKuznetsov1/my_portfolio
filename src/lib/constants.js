import {
  GithubIcon,
  MailIcon,
  SparklesIcon,
  PencilLineIcon,
  NavigationIcon,
  FolderKanbanIcon,
  CodeIcon
} from 'lucide-react'

export const PROFILES = {
  github: {
    title: 'GitHub',
    url: 'https://github.com/AntonKuznetsov1',
    icon: <GithubIcon size={16} />
  }
}

export const COLLECTION_IDS = [
  18259129, 15968768, 23598938, 16949672, 15807896, 15807897, 15969648, 16338467, 15896982, 25589709
]

export const SKILLS = ['HTML', 'CSS', 'JavaScript', 'React', 'Next.js', 'Node.js', 'API development', 'UI/UX design']

export const SERVICES = ['Business websites', 'Portfolio websites', 'Landing pages', 'Website redesigns']

export const LINKS = [
  {
    href: '/',
    label: 'Home',
    icon: <SparklesIcon size={16} />
  },
  {
    href: '/writing',
    label: 'Blog3',
    icon: <PencilLineIcon size={16} />
  },
  {
    href: '/journey',
    label: 'Journey',
    icon: <NavigationIcon size={16} />
  },
  {
    href: '/projects',
    label: 'Projects',
    icon: <FolderKanbanIcon size={16} />
  },
  {
    href: '/skills',
    label: 'Skills',
    icon: <CodeIcon size={16} />
  },
  {
    href: '/contact',
    label: 'Contact',
    icon: <MailIcon size={16} />
  }
]

export const SCROLL_AREA_ID = 'scroll-area'
export const MOBILE_SCROLL_THRESHOLD = 20
