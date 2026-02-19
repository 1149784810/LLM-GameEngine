# Match-3 Game - Team Allocation

**Document ID**: TEAM-ALLOCATION-v1.0-20260220
**Date**: 2026-02-20
**Status**: Active

---

## 1. Core Team (Always Online)

| Role ID | Role Name | Agent | Responsibility |
|---------|-----------|-------|----------------|
| PL-001 | Project Leader (PL) | Current AI | Unified dispatch, communication relay |

---

## 2. Design Team (Phase 1 Stage 2)

| Role ID | Role Name | Agent | Module | Output Location |
|---------|-----------|-------|--------|-----------------|
| GD-001 | Lead Designer (LD) | game-lead-designer | Requirements split, integration | docs/design/ |
| GD-002 | System Designer (SD-1) | game-systems-designer | Match-3 core mechanics | docs/design/ |
| GD-003 | System Designer (SD-2) | game-systems-designer | Special elements, obstacles | docs/design/ |
| GD-004 | Level Designer (LvD-1) | game-level-designer | 50 levels design | docs/design/ |
| GD-005 | Balance Designer (BD-1) | game-balance-designer | Difficulty curves, scoring | docs/design/ |
| GD-006 | UI Designer (UID-1) | frontend-visual-crafter | UI/UX layout | docs/design/ |
| GD-007 | 3C Designer (3CD-1) | game-3c-designer | Animation specs | docs/design/ |
| GD-008 | Audio Designer (AD) | audio-generator | Sound effects requirements | docs/design/ |

**Note**: Tutorial designer (TD) not required per user specification.

---

## 3. Programming Team (Phase 2 Stage 2)

| Role ID | Role Name | Agent | Module | Specialization |
|---------|-----------|-------|--------|----------------|
| PG-001 | Lead Programmer (LP) | client-programmer-leader | Architecture, framework | Technical architecture |
| PG-002 | Core Programmer (CP-1) | skill-systems-developer | Board logic, matching | Core systems |
| PG-003 | Core Programmer (CP-2) | skill-systems-developer | Special elements, cascades | Core systems |
| PG-004 | Core Programmer (CP-3) | skill-systems-developer | Save system (localStorage) | Core systems |
| PG-005 | UI Programmer (UIP-1) | frontend-visual-crafter | Game UI rendering | UI systems |
| PG-006 | UI Programmer (UIP-2) | frontend-visual-crafter | Animations, effects | UI systems |
| PG-007 | Level Programmer (LvP-1) | level-programmer | Level loading, objectives | Level systems |
| PG-008 | Audio Programmer (AP) | audio-generator | Sound implementation | Audio systems |

---

## 4. QA Team (Phase 3)

| Role ID | Role Name | Agent | Module |
|---------|-----------|-------|--------|
| QA-001 | Lead Tester (LT) | qa-standards-manager | Test planning, coordination |
| QA-002 | QA-Core (QA-1) | game-requirement-verifier | Core gameplay testing |
| QA-003 | QA-UI (QA-2) | game-requirement-verifier | UI/UX testing |
| QA-004 | QA-Level (QA-3) | game-requirement-verifier | Level testing |
| VV-001 | Visual Verifier | vision-interpreter | Visual testing |

---

## 5. Parallel Execution Strategy

### Phase 1 Stage 2 (Design - 7 parallel)
```
┌─────────────────────────────────────────────────────────┐
│ GD-002: Match-3 core mechanics                          │
│ GD-003: Special elements, obstacles                     │
│ GD-004: 50 levels design                                │
│ GD-005: Difficulty curves, scoring                      │
│ GD-006: UI/UX layout                                    │
│ GD-007: Animation specs                                 │
│ GD-008: Audio requirements                              │
└─────────────────────────────────────────────────────────┘
            ↓ All outputs to docs/design/
            ↓ Lead Designer integrates
```

### Phase 2 Stage 2 (Programming - 7 parallel)
```
┌─────────────────────────────────────────────────────────┐
│ PG-002: Board logic, matching algorithm                 │
│ PG-003: Special elements, cascades                      │
│ PG-004: Save system                                     │
│ PG-005: Game UI rendering                               │
│ PG-006: Animations, effects                             │
│ PG-007: Level loading, objectives                       │
│ PG-008: Sound implementation                            │
└─────────────────────────────────────────────────────────┘
            ↓ All outputs to src/
            ↓ Lead Programmer reviews
```

### Phase 3 Stage 3 (QA - 4 parallel)
```
┌─────────────────────────────────────────────────────────┐
│ QA-002: Core gameplay FT                                │
│ QA-003: UI/UX FT                                        │
│ QA-004: Level FT                                        │
│ VV-001: Visual VT                                       │
└─────────────────────────────────────────────────────────┘
            ↓ Results to Lead Tester
            ↓ Lead Tester reports to Lead Programmer
```

---

## 6. Asset Generation

**Style**: Anime-style (二次元)
**Method**: AI generation via LiblibAI MCP tool
**Trigger**: Automatically when assets needed

| Asset Type | Location | Generation Trigger |
|------------|----------|-------------------|
| Element gems | assets/images/elements/ | During Phase 2 |
| Special effects | assets/images/effects/ | During Phase 2 |
| UI elements | assets/images/ui/ | During Phase 2 |
| Backgrounds | assets/images/backgrounds/ | During Phase 2 |
| Sound effects | assets/audio/sfx/ | During Phase 2 |
| BGM | assets/audio/bgm/ | During Phase 2 |

---

## 7. Workload Distribution

| Phase | Active Roles | Parallel Count | Notes |
|-------|--------------|----------------|-------|
| Phase 1 Stage 1 | LD | 1 | Blocked |
| Phase 1 Stage 2 | GD-002~008 | 7 | Parallel |
| Phase 1 Stage 3 | LD | 1 | Blocked |
| Phase 2 Stage 1 | LP | 1 | Blocked |
| Phase 2 Stage 2 | PG-002~008 | 7 | Parallel |
| Phase 2 Stage 3 | LP | 1 | Blocked |
| Phase 3 Stage 1 | LD | 1 | Blocked |
| Phase 3 Stage 2 | GD-002~008 | 7 | Parallel QA |
| Phase 3 Stage 3 | QA Team | 4 | Parallel testing |

---

**Approved by**: PL
**Date**: 2026-02-20
