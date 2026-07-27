export interface Project {
  /** Kiosk id used by the 3D scene + nav (matches card-<id> in the DOM). */
  id: string
  /** Small label above the title, e.g. "Project · Secure RAG". */
  kicker: string
  title: string
  tags: string[]
  description: string
  /** External link (GitHub repo or live demo). Omit for private client work. */
  href?: string
  /** 'site' renders a live-site link/icon instead of the default GitHub repo styling. */
  linkType?: 'repo' | 'site'
}

export const projects: Project[] = [
  {
    id: 'p-markaba',
    kicker: 'Founder · Markaba AI',
    title: 'Markaba AI — Automotive Intelligence Platform',
    tags: ['Python', 'FastAPI', 'React', 'Claude API', 'pgvector', 'Docker'],
    description:
      'Solo-founded and built Markaba AI (markabaai.com): an AI automotive intelligence platform with a multi-layer engine (Diagnose → Match → Rank → Quote) on the Claude API that converts natural-language vehicle symptoms into matched parts, ranked workshops, and bookable repair quotes. RAG-based parts matching with LlamaIndex + pgvector, bilingual (English/Arabic) React + Vite frontend, FastAPI backend — zero to live production within three weeks of the first commit.',
    href: 'https://markabaai.com',
    linkType: 'site',
  },
  {
    id: 'p-rag',
    kicker: 'Project · Secure RAG',
    title: 'GovShield — Offline RAG Portal',
    tags: ['LlamaIndex', 'pgvector', 'FastAPI', 'RBAC'],
    description:
      '100% offline RAG system with RBAC pre-filtering at the vector store layer — access control enforced before retrieval, not after. LlamaIndex + Ollama + PostgreSQL pgvector + FastAPI REST API. Dockerized two-service deployment.',
    href: 'https://github.com/zencodelab/raglearn',
  },
  {
    id: 'p-agent',
    kicker: 'Project · Autonomous Agent',
    title: 'TaskEngine — Autonomous Agent',
    tags: ['LangChain', 'LangGraph', 'Pinecone', 'FastAPI'],
    description:
      'Plan→Execute→Reflect loop: a LangChain planner decomposes queries into atomic steps, a LangGraph ReAct executor runs each with tools (web search, code execution, file I/O), and a reflector scores quality and re-plans on failure. Pinecone stores past runs as few-shot context.',
    href: 'https://github.com/zencodelab/aiautonomous',
  },
  {
    id: 'p-vision',
    kicker: 'Project · Vision AI',
    title: 'VisionLog-MLX',
    tags: ['Python', 'OpenCV', 'Ollama', 'Apple Silicon'],
    description:
      'On-device vision logger using OpenCV for motion detection, dlib for face recognition, and Ollama Gemma for real-time scene description. Fully offline on Apple Silicon via Metal acceleration.',
    href: 'https://github.com/zencodelab/MehvishLog',
  },
  {
    id: 'p-gis',
    kicker: 'Project · GIS Database',
    title: 'GIS Water Network DB',
    tags: ['Python', 'SQL', 'QGIS', 'EPANET'],
    description:
      'A GIS-integrated water network database application in QGIS using Python and SQL. Automates node elevation extraction and workflows for EPANET and JalTantra.',
    href: 'https://github.com/zencodelab',
  },
  {
    id: 'p-chat',
    kicker: 'Project · Real-Time Web',
    title: 'Real-Time Messaging Platform',
    tags: ['Flask', 'Socket.IO', 'Elasticsearch'],
    description:
      'A Flask-based real-time coordination and workspace system using Socket.IO for bi-directional messaging and Elasticsearch for fast query indexing.',
    href: 'https://github.com/zencodelab',
  },
  {
    id: 'p-flight',
    kicker: 'Project · Predictive ML',
    title: 'Flight Delay Predictor',
    tags: ['Python', 'XGBoost', 'SMOTE'],
    description:
      'A binary classification engine using Python and XGBoost to predict delays exceeding 15 minutes, solving heavy class imbalance with SMOTE.',
    href: 'https://github.com/zencodelab',
  },
]
