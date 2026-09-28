import React from 'react';

const ROLE_PRESETS = [
  { id: 'swe', label: 'Software Engineering', icon: '💻' },
  { id: 'sound', label: 'Sound Engineering', icon: '🎧' },
  { id: 'data', label: 'Data Engineering', icon: '📊' },
  { id: 'pm', label: 'Product Management', icon: '📋' },
];

const PRESET_JDS = {
  swe: `We are looking for a Senior Backend Engineer to join our distributed infrastructure team.

Key Responsibilities:
- Architect and maintain high-performance asynchronous microservices with Python and FastAPI.
- Design resilient relational schemas, execute database migrations, and optimize queries in PostgreSQL.
- Containerize services with Docker and orchestrate workloads across Kubernetes clusters.
- Implement scalable event-driven messaging pipelines utilizing Apache Kafka.
- Optimize API latency and cache invalidation strategies using Redis.

Requirements:
- 4+ years of backend production engineering experience with Python and modern async frameworks (FastAPI/Django/Flask).
- Hands-on experience with PostgreSQL schema design, indexing strategies, and connection pooling.
- Proven familiarity with containerization (Docker) and cloud-native orchestration (Kubernetes).
- Experience with event streaming or message brokers (Kafka or RabbitMQ).
- Preferred: Redis in-memory caching, GraphQL, and AWS cloud services.`,

  sound: `Seeking a Sound Engineer / Audio Systems Developer for our media production platform.

Key Responsibilities:
- Design and implement real-time audio processing pipelines with low latency.
- Develop signal processing algorithms using Python and C++ for studio-quality output.
- Integrate DAW plugins and MIDI controllers with custom software systems.
- Maintain audio streaming infrastructure across cloud and on-premise systems.

Requirements:
- Strong background in digital signal processing (DSP) and audio engineering.
- Proficiency with Pro Tools, Ableton, or Logic Pro integration APIs.
- Experience with Python, C++, and real-time audio frameworks (JUCE, PortAudio).
- Knowledge of audio codecs (AAC, FLAC, Opus) and streaming protocols.
- Preferred: Experience with spatial audio, Dolby Atmos, or 3D sound design.`,

  data: `Looking for a Data Engineer to build and scale our analytics and data pipeline infrastructure.

Key Responsibilities:
- Design and maintain scalable ETL/ELT data pipelines using Apache Spark and Airflow.
- Build real-time streaming data integrations with Kafka and Flink.
- Optimize data warehouse schemas in BigQuery, Redshift, or Snowflake.
- Implement data quality monitoring and validation frameworks.

Requirements:
- 3+ years building production data pipelines with Python, SQL, and Spark.
- Hands-on experience with workflow orchestration tools (Airflow, Dagster, Prefect).
- Proficiency in data modeling, schema design, and query optimization.
- Experience with cloud data platforms (AWS, GCP, or Azure).
- Preferred: dbt, Great Expectations, and real-time streaming with Kafka/Flink.`,

  pm: `Hiring a Product Manager to drive strategy and roadmap for our developer tools platform.

Key Responsibilities:
- Define product vision, strategy, and roadmap aligned with company objectives.
- Conduct user research, competitive analysis, and customer interviews.
- Write detailed PRDs, user stories, and acceptance criteria for engineering teams.
- Analyze product metrics using SQL, Amplitude, and Mixpanel to drive data-informed decisions.

Requirements:
- 3+ years product management experience in B2B SaaS or developer tools.
- Strong analytical skills with proficiency in SQL and product analytics platforms.
- Excellent written and verbal communication skills.
- Experience with Agile/Scrum methodologies and tools (Jira, Linear).
- Preferred: Technical background, familiarity with APIs, and design thinking frameworks.`,
};

export default function QuickRolePresets({ activePreset, onSelect }) {
  return (
    <nav aria-label="Role Preset Selection" className="w-full py-4 border-y border-slate-200 my-6">
      <div className="flex flex-row items-center gap-3 overflow-x-auto scrollbar-none">
        <span className="text-sm font-medium text-slate-600 whitespace-nowrap">Target Role Preset:</span>
        {ROLE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelect(preset.id, PRESET_JDS[preset.id])}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activePreset === preset.id
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span>{preset.icon}</span>
            <span>{preset.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

export { PRESET_JDS, ROLE_PRESETS };
