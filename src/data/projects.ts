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
    tags: ['Python', 'FastAPI', 'React', 'Claude API', 'PostgreSQL', 'Docker'],
    description:
      'Founded and built Markaba AI (markabaai.com): an AI automotive diagnostics and marketplace platform whose engine (Diagnose → Match → Rank → Quote) runs on the Claude API and turns natural-language vehicle symptoms into matched parts, ranked workshops, and bookable quotes. Bilingual (English/Arabic) React + Vite frontend, FastAPI backend, two read-only MCP connectors live in production — first commit to live production in two weeks. Built with Claude Code as the primary coding tool; I owned the requirements, product and design decisions.',
    href: 'https://markabaai.com',
    linkType: 'site',
  },
  {
    id: 'p-dtwin',
    kicker: 'Personal Project · Digital Twin',
    title: 'DTwin — Building Digital Twin with an AI Copilot',
    tags: ['PostGIS', 'TimescaleDB', 'Node.js', 'FastAPI', 'LangGraph.js', 'Claude'],
    description:
      'A digital twin of a demo office building on simulated telemetry: PostGIS + TimescaleDB in one Postgres, a Node.js ingest service with WebSocket fan-out, a FastAPI energy simulator, and a react-three-fiber 3D dashboard rendered from the stored geometry; multi-tenant via row-level security. A LangGraph.js + Claude copilot proposes setpoint changes but cannot apply one without a person\'s approval — its command node is reachable only through an interrupt(). Personal project, built with Claude Code.',
    href: 'https://github.com/zencodelab/DTwin',
  },
  {
    id: 'p-rag',
    kicker: 'Project · RAG with Access Control',
    title: 'GovShield — Local RAG Portal',
    tags: ['LlamaIndex', 'pgvector', 'Ollama', 'Streamlit', 'RBAC'],
    description:
      'A Streamlit RAG portal over internal documents, built on LlamaIndex + PostgreSQL pgvector with the LLM and embeddings served locally by Ollama. Each document is tagged with a clearance level, and the user\'s clearance is applied as a metadata filter inside the vector query, so restricted chunks are never retrieved rather than hidden afterwards. Docker Compose setup; a FastAPI layer over the same pipeline is unfinished.',
    href: 'https://github.com/zencodelab/raglearn',
  },
  {
    id: 'p-agent',
    kicker: 'Project · Agent Loop',
    title: 'TaskEngine — Plan → Execute → Reflect',
    tags: ['LangChain', 'LangGraph', 'Pinecone', 'Python'],
    description:
      'A Plan → Execute → Reflect loop: a LangChain planner breaks a query into steps, LangGraph\'s prebuilt ReAct agent runs each step with tools (web search, Python execution, file I/O, URL fetch), and a LangChain reflector scores the result and triggers a bounded re-plan when it falls short. Optionally stores past runs in Pinecone as few-shot context for the planner.',
    href: 'https://github.com/zencodelab/aiautonomous',
  },
  {
    id: 'p-vision',
    kicker: 'Project · Vision AI',
    title: 'MehvishLog — Local Vision Logger',
    tags: ['Python', 'OpenCV', 'Ollama', 'Gemma'],
    description:
      'A webcam logger that runs on one Mac: OpenCV frame differencing detects motion, and when it does, a Gemma vision model running locally in Ollama writes a one-sentence description of the frame to a timestamped log.',
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
