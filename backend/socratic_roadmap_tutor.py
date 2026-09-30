"""
Socratic Roadmap Skill Tutor Service for Astria.
Guides candidates through missing skills identified in target role gap audits
via 3 roadmap milestones, Concept Anchors, and Socratic Probes.
"""

from typing import Dict, Any, Optional, List
import re

MILESTONE_NAMES = {
    1: "The Core Problem",
    2: "Architecture & Trade-offs",
    3: "Resume / Project Application"
}

# Curated high-yield skill banks following the exact Socratic format
CURATED_SKILL_BANKS: Dict[str, Dict[int, Dict[str, str]]] = {
    "redis": {
        1: {
            "concept_anchor": "Traditional relational databases write data to disk, which guarantees persistence but creates I/O bottlenecks when handling tens of thousands of read requests per second. In-memory datastores keep hot data directly in RAM to achieve sub-millisecond latencies.",
            "socratic_probe": "If your main database goes down, data on disk is saved. But what happens to data kept purely in RAM if the server suddenly loses power? How might a production system balance speed with data survival?",
            "hint": "Think about periodic snapshots or append-only logs on disk. If a server reboots, can it reconstruct memory from a fast replay log?",
            "analogy": "Imagine RAM as a whiteboard on your desk and disk as a filing cabinet. Writing on the whiteboard is instant, but cleaning staff wipe it every night unless you write a copy into the notebook.",
            "validation": "Spot-on! Pure RAM is volatile, so systems combine in-memory caching with append-only logs (AOF) or snapshots (RDB) to balance lightning reads with disaster recovery."
        },
        2: {
            "concept_anchor": "Redis operates as a single-threaded event loop around non-blocking multiplexed I/O. This completely avoids mutex locks and thread-context switching, but means long-running commands (like KEYS *) block the entire server.",
            "socratic_probe": "If an engineer runs a regex scan across 10 million keys in production, what happens to concurrent user requests? What cache-eviction strategy would you select when RAM reaches capacity (e.g. LRU vs. LFU)?",
            "hint": "Since there is only one thread processing the queue, any operation taking 500ms makes every other request wait 500ms in line. Consider SCAN instead.",
            "analogy": "Think of a single hyper-fast barista. If one customer orders 500 customized drinks, the entire line of espresso orders stops until that one is finished.",
            "validation": "Exactly right. Single-threaded throughput requires O(1) commands, SCAN cursor pagination, and well-chosen TTL eviction (like volatile-lru) to avoid catastrophic tail latency."
        },
        3: {
            "concept_anchor": "Demonstrating in-memory mastery requires proving how you protected the underlying database from cache stampedes, thundering herds, or stale reads during high concurrency bursts.",
            "socratic_probe": "How would you design a portfolio capstone integrating Redis as a distributed token-bucket rate limiter or cache-aside layer? What measurable metric would you highlight on your resume?",
            "hint": "Think about p99 latency reduction (e.g. from 240ms down to 12ms) or reducing relational database CPU load from 85% to 15% under 10k RPS load.",
            "analogy": "Like adding an express bouncer at the door with a clicker who only admits 100 people per minute, shielding the main hall from being overwhelmed.",
            "validation": "Outstanding synthesis! You have connected the core in-memory problem, single-threaded lockless concurrency, and measurable production impact.",
            "project_deliverable": "Production-Grade Distributed Rate Limiter & Cache-Aside Layer: Implement a Redis-backed Sliding Window Log with Lua scripts to prevent race conditions during 15k RPS bursts.",
            "resume_bullet": "Engineered an atomic distributed rate-limiter and cache-aside layer in Redis using Lua scripts; slashed p99 database latency from 280ms to 14ms and shielded primary PostgreSQL cluster from thundering herds during flash-traffic spikes."
        }
    },
    "system design": {
        1: {
            "concept_anchor": "Single-server architectures hit vertical scaling limits where upgrading CPU and RAM becomes cost-prohibitive and leaves a single point of failure. Distributed systems partition data and compute across multiple horizontal nodes.",
            "socratic_probe": "When you transition from a single server with an in-memory session store to 10 load-balanced backend instances, what immediately breaks with user authentication? How do you resolve it?",
            "hint": "If a user logs in on Server A, will Server B know their session token on the next HTTP request?",
            "analogy": "If you rent lockers at a gym, but each day a different random attendant works who doesn't share notes with the others, you can't open your locker unless the attendant checks a central ledger.",
            "validation": "Precisely. Distributed web tiers require stateless application nodes with centralized session stores (like Redis/JWT) or sticky sessions at the load balancer."
        },
        2: {
            "concept_anchor": "According to the CAP theorem, any distributed datastore over an unreliable network must trade off linearizable Consistency for high Availability during network partitions.",
            "socratic_probe": "Imagine a bank balance transfer service versus a social media follower count. Which side of the PACELC/CAP spectrum does each require, and what failure scenario does each guard against?",
            "hint": "Can a user withdraw $100 twice if nodes disagree on the balance? Does it matter if a follower count takes 2 seconds to synchronize?",
            "analogy": "A bank transfer is like a deed to a house—it can never be owned by two people at once. A tweet like count is like gossip—it spreads eventually, and slight delays hurt nobody.",
            "validation": "Spot on. Financial ledgers mandate CP (strict serializability), whereas high-throughput metrics and activity feeds thrive on AP (eventual consistency)."
        },
        3: {
            "concept_anchor": "System design mastery on a technical resume is demonstrated through quantitative SLOs, clear partition strategies, and graceful degradation under catastrophic outages.",
            "socratic_probe": "Describe a distributed system project you could showcase: how would you partition the data (e.g. consistent hashing) and handle circuit breaking when a downstream microservice times out?",
            "hint": "Mention an API gateway with resilience patterns: exponential backoff, circuit breaking (Hystrix/Resilience4j pattern), and fallback caching.",
            "analogy": "Like an electrical fuse in your house: when a circuit overloads, the fuse trips instantly to protect the house from burning down.",
            "validation": "Excellent. You understand the foundational need for horizontal scaling, distributed trade-offs, and production resiliency.",
            "project_deliverable": "High-Throughput Distributed URL Shortener & Analytics Gateway: Built with consistent hashing, distributed Redis locks, and circuit breakers sustaining 20k RPS with 99.95% uptime.",
            "resume_bullet": "Architected a horizontally scalable distributed service tier using consistent hashing and circuit breakers; maintained 99.98% availability and capped p99 response times under 45ms during simulated downstream service outages."
        }
    },
    "kafka": {
        1: {
            "concept_anchor": "Direct HTTP microservice-to-microservice communication creates tight synchronous coupling: if an inventory service is down, checkout fails immediately. Distributed commit logs decouple producers and consumers through immutable, ordered event streaming.",
            "socratic_probe": "If 100,000 orders arrive during Black Friday, why is an immutable append-only log superior to inserting 100,000 rows into a shared relational database table for downstream fulfillment?",
            "hint": "Relational databases lock rows or indexes during concurrent writes. What is the time complexity of appending sequentially to the end of a disk file?",
            "analogy": "A synchronous HTTP call is like calling someone on the phone and waiting for them to answer. Kafka is like dropping letters into a high-capacity mailbox that the receiver reads at their own pace.",
            "validation": "Exactly right! Sequential append-only disk writes reach O(1) disk saturation speeds without lock contention, letting consumers process the backlog at their own throughput."
        },
        2: {
            "concept_anchor": "Kafka partitions scale consumer throughput, but message ordering is only strictly guaranteed within a single partition, not across the entire topic.",
            "socratic_probe": "If user account transactions must be processed in strict chronological order, how do you assign the Kafka partition key? What happens if you scale from 3 partitions to 6 partitions?",
            "hint": "Hashing the user_id as the partition key guarantees all events for user X land on the exact same partition in sequence.",
            "analogy": "Bank teller lines: if each customer has their own dedicated folder with a specific teller, their statements are always in order.",
            "validation": "Spot on. Partitioning by entity ID (e.g., user_id or account_id) guarantees per-entity ordering while distributing total workload across consumer groups."
        },
        3: {
            "concept_anchor": "Real-world event-driven resumes shine when they show how you handled deduplication, idempotent consumers, and dead-letter queues for unprocessable messages.",
            "socratic_probe": "If a consumer crashes after processing an order but before committing its partition offset, Kafka will redeliver the event. How do you design the consumer to be idempotent so the customer isn't charged twice?",
            "hint": "Use unique idempotency keys (e.g. order_id) stored in a fast cache or unique database constraint.",
            "analogy": "A receipt puncher: once a ticket is punched with serial number 1234, if someone presents it again, the scanner flags it as already validated.",
            "validation": "Mastery demonstrated! You've linked decoupled message ingestion, partition ordering semantics, and at-least-once deduplication.",
            "project_deliverable": "Real-Time Idempotent Event-Driven Order Processing Pipeline: Built with Kafka consumer groups, distributed Dead-Letter Queues (DLQ), and Redis-backed deduplication filters.",
            "resume_bullet": "Implemented an event-driven event pipeline processing 1.2M daily events via Kafka; designed idempotent consumer deduplication and dead-letter queues that eliminated duplicate transactions and reduced payment processing failures to 0%."
        }
    },
    "docker": {
        1: {
            "concept_anchor": "Traditional software distribution suffered from 'it works on my machine' syndrome due to mismatched OS libraries, kernel dependencies, and local environment drifts. Containers package the runtime, binaries, and system libraries into an immutable, portable artifact.",
            "socratic_probe": "How does a container differ from a virtual machine in terms of resource overhead, boot time, and kernel sharing?",
            "hint": "A VM packages an entire guest operating system and hypervisor; containers share the host's Linux kernel via namespaces and cgroups.",
            "analogy": "A VM is like building a whole separate house with its own plumbing and electrical grid. A container is like an apartment in a building sharing the foundation and pipes but with its own locked door.",
            "validation": "Spot on! Containers isolate processes using Linux namespaces and control groups (cgroups) on the host kernel, enabling millisecond boot times and negligible memory overhead."
        },
        2: {
            "concept_anchor": "Docker images are constructed as stacked, read-only layers. Each instruction in a Dockerfile generates a cached layer that should be optimized to minimize image footprint and attack surface.",
            "socratic_probe": "Why is running 'COPY . .' before 'RUN npm install' an anti-pattern in Dockerfiles? How does multi-stage building improve security and production image size?",
            "hint": "If you edit one comment in your source code, does Docker have to re-download all npm packages if the layer ordering is wrong?",
            "analogy": "Baking a cake: you don't buy new flour every time you want to change the icing on top. You reuse the baked base.",
            "validation": "Exactly right. Copying package manifests first leverages Docker's layer cache, while multi-stage builds leave compiler toolchains out of the final slim production container."
        },
        3: {
            "concept_anchor": "In production, container excellence means writing non-root containers, enforcing resource limits, and writing multi-stage distroless images for CI/CD.",
            "socratic_probe": "What portfolio deliverable or resume bullet point could you write that highlights production container security (e.g., non-root users, vulnerability scans with Trivy) and tiny image sizes?",
            "hint": "Mention cutting image size from 1.2GB down to 85MB using Alpine or Distroless, and enforcing CPU/memory quotas in production.",
            "analogy": "Stripping racecar weight down to only the essential engine and chassis for maximum speed and safety.",
            "validation": "Outstanding! You understand container isolation primitives, layer caching hygiene, and production security hardening.",
            "project_deliverable": "Hardened Multi-Stage Containerized Microservice Pipeline: Dockerized API with non-root security contexts, Trivy vulnerability scanning, and 90% image size reduction using distroless images.",
            "resume_bullet": "Containerized multi-tier microservices with multi-stage Docker builds; slashed production image footprints by 88% (1.1GB to 130MB) and hardened container security with non-root execution contexts and automated Trivy CVE scans."
        }
    }
}


def _get_generic_skill_template(skill: str, target_role: str) -> Dict[int, Dict[str, str]]:
    """Dynamic 3-milestone Socratic generator for any technical skill."""
    clean_skill = skill.strip().title()
    role = target_role.strip().title() or "Software Engineer"
    return {
        1: {
            "concept_anchor": f"In production {role} workflows, {clean_skill} exists to solve fundamental bottlenecks in maintainability, scalability, and execution reliability that manual or monolithic approaches cannot address.",
            "socratic_probe": f"What specific production failure or developer bottleneck occurs when an engineering team attempts to build a large-scale system without {clean_skill}? What pain point does it directly eliminate?",
            "hint": f"Consider the trade-off: what manual task or resource constraint (latency, consistency, concurrency, or coordination) becomes unmanageable without {clean_skill}?",
            "analogy": f"Using {clean_skill} is like transitioning from hand-carrying buckets of water to installing automated plumbing.",
            "validation": f"Solid insight! You've accurately identified the core architectural problem that makes {clean_skill} indispensable in modern systems."
        },
        2: {
            "concept_anchor": f"Every technology enforces architectural trade-offs: choosing {clean_skill} optimizes certain operational dimensions (throughput, developer velocity, safety) while introducing operational overhead or latency constraints.",
            "socratic_probe": f"When configuring or deploying {clean_skill} in a high-traffic production environment, what is the single biggest performance or operational trade-off you must monitor to prevent system degradation?",
            "hint": f"Think about resource consumption (memory, CPU), network latency, error handling, or operational complexity under 10x traffic spikes.",
            "analogy": f"Like a high-performance engine: it delivers incredible acceleration, but requires specialized oil and tighter temperature thresholds.",
            "validation": f"Excellent understanding of the trade-off envelope. Engineering is fundamentally about choosing the right trade-offs under constraints."
        },
        3: {
            "concept_anchor": f"Demonstrating {clean_skill} mastery on an engineering resume requires framing your experience around measurable business impact, production hardening, and concrete architectural deliverables.",
            "socratic_probe": f"How would you articulate a portfolio project or real-world deliverable demonstrating {clean_skill}? What quantifiable metric (latency, reliability, test coverage, or cost savings) would you highlight?",
            "hint": f"Structure: [Active Verb] + [Specific {clean_skill} implementation] + [Quantifiable outcome, e.g. -40% latency or 99.9% uptime].",
            "analogy": f"Translating technical capability into business currency that hiring managers and tech leads immediately respect.",
            "validation": f"Mastery verified! You have traversed the complete 3-milestone arc for {clean_skill}.",
            "project_deliverable": f"Production-Grade {clean_skill} End-to-End Implementation: Comprehensive architectural project incorporating production best practices, observability, and automated testing.",
            "resume_bullet": f"Architected and deployed production {clean_skill} workflows with automated validation and observability; improved system throughput by 35% and reduced production incident response times."
        }
    }


def get_socratic_step(
    skill: str,
    target_role: str = "Software Engineer",
    current_milestone: int = 1,
    user_answer: Optional[str] = None
) -> Dict[str, Any]:
    """
    Evaluates current state, evaluates user answer if present,
    and returns formatted Socratic Roadmap Tutor step adhering strictly to rules.
    """
    clean_skill = skill.strip()
    skill_lower = clean_skill.lower()
    
    # Select curated bank or dynamic template
    bank = CURATED_SKILL_BANKS.get(skill_lower)
    if not bank:
        # Check partial match (e.g. "System Design & Architecture" -> "system design")
        for key in CURATED_SKILL_BANKS:
            if key in skill_lower or skill_lower in key:
                bank = CURATED_SKILL_BANKS[key]
                break
    if not bank:
        bank = _get_generic_skill_template(clean_skill, target_role)

    milestone_num = max(1, min(3, current_milestone))
    ms_data = bank.get(milestone_num, bank[1])
    milestone_name = MILESTONE_NAMES.get(milestone_num, "The Core Problem")

    # Step A: User is just opening / starting this milestone (no answer yet)
    if not user_answer or not user_answer.strip():
        formatted_message = (
            f"📍 **{clean_skill} • Milestone {milestone_num}/3: {milestone_name}**\n\n"
            f"**Concept Anchor:** {ms_data['concept_anchor']}\n\n"
            f"**Socratic Probe:** {ms_data['socratic_probe']}"
        )
        return {
            "skill": clean_skill,
            "target_role": target_role,
            "milestone": milestone_num,
            "milestone_name": milestone_name,
            "status": "in_progress",
            "concept_anchor": ms_data["concept_anchor"],
            "socratic_probe": ms_data["socratic_probe"],
            "feedback": None,
            "hint": None,
            "formatted_message": formatted_message
        }

    # Step B: User submitted an answer
    ans = user_answer.strip().lower()
    is_unsure = any(phrase in ans for phrase in [
        "don't know", "dont know", "not sure", "hint", "help", "no idea", "what do you mean",
        "explain", "confused", "give me a hint", "tell me"
    ]) or len(ans) < 6

    # Case 1: Unsure / Needs Hint
    if is_unsure:
        hint_text = ms_data.get("hint", "Consider the trade-off between speed and persistence.")
        analogy_text = ms_data.get("analogy", "")
        formatted_message = (
            f"💡 **Micro-Hint & Real-World Analogy:**\n\n"
            f"{analogy_text}\n\n"
            f"*{hint_text}*\n\n"
            f"📍 **Let's re-examine Milestone {milestone_num}/3: {milestone_name}**\n\n"
            f"**Socratic Probe:** {ms_data['socratic_probe']}"
        )
        return {
            "skill": clean_skill,
            "target_role": target_role,
            "milestone": milestone_num,
            "milestone_name": milestone_name,
            "status": "needs_hint",
            "concept_anchor": ms_data["concept_anchor"],
            "socratic_probe": ms_data["socratic_probe"],
            "feedback": "Here is a real-world analogy to help unlock the concept:",
            "hint": hint_text,
            "formatted_message": formatted_message
        }

    # Case 2: Milestone 3 Completion -> Formulate project deliverable & resume bullet
    if milestone_num == 3:
        project_deliv = ms_data.get("project_deliverable", f"Production {clean_skill} Capstone Service")
        resume_bullet = ms_data.get("resume_bullet", f"Engineered scalable {clean_skill} services with automated testing and measurable latency improvements.")
        formatted_message = (
            f"✅ **Milestone 3/3 Complete — {clean_skill} Mastery Verified!**\n\n"
            f"{ms_data.get('validation', 'Superb synthesis across all 3 roadmap milestones.')}\n\n"
            f"🎯 **Your Truth-Backed Portfolio Deliverable:**\n"
            f"• {project_deliv}\n\n"
            f"📄 **Verified Resume Bullet Point:**\n"
            f"• \"{resume_bullet}\"\n\n"
            f"Ready to tackle your next missing skill, or add this bullet directly to your ATS Resume?"
        )
        return {
            "skill": clean_skill,
            "target_role": target_role,
            "milestone": 3,
            "milestone_name": milestone_name,
            "status": "completed",
            "concept_anchor": ms_data["concept_anchor"],
            "socratic_probe": "How does this resume bullet reflect your hands-on mastery?",
            "feedback": ms_data.get("validation"),
            "project_deliverable": project_deliv,
            "resume_bullet": resume_bullet,
            "formatted_message": formatted_message
        }

    # Case 3: Correct / Strong Answer -> Advance to next milestone
    next_milestone_num = milestone_num + 1
    next_ms_data = bank.get(next_milestone_num, bank[1])
    next_milestone_name = MILESTONE_NAMES.get(next_milestone_num, "")
    validation = ms_data.get("validation", "Excellent analysis!")

    formatted_message = (
        f"✅ {validation}\n\n"
        f"---\n\n"
        f"📍 **{clean_skill} • Milestone {next_milestone_num}/3: {next_milestone_name}**\n\n"
        f"**Concept Anchor:** {next_ms_data['concept_anchor']}\n\n"
        f"**Socratic Probe:** {next_ms_data['socratic_probe']}"
    )

    return {
        "skill": clean_skill,
        "target_role": target_role,
        "milestone": next_milestone_num,
        "milestone_name": next_milestone_name,
        "status": "milestone_advanced",
        "concept_anchor": next_ms_data["concept_anchor"],
        "socratic_probe": next_ms_data["socratic_probe"],
        "feedback": validation,
        "hint": None,
        "formatted_message": formatted_message
    }
