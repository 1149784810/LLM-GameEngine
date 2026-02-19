# Match-3 Casual Web Game - Requirements Specification

**Document ID**: LD-REQ-SPLIT-v1.0-20260220
**Version**: 1.0
**Date**: 2026-02-20
**Status**: Confirmed

---

## 1. Project Overview

### 1.1 Project Name
Match-3 Casual Web Game (三消类休闲网页游戏)

### 1.2 Target Platform
- Web Browser (HTML5)
- PC and Mobile responsive design

### 1.3 Art Style
- Anime-style (二次元) AI-generated assets

### 1.4 Tutorial Requirement
- No beginner tutorial required

---

## 2. Core Gameplay

### 2.1 Board Configuration
| Parameter | Value |
|-----------|-------|
| Board Size | 7x7 grid |
| Element Types | 5 types |
| Match Minimum | 3 elements |

### 2.2 Interaction Mechanism
- **Primary**: Slide/Swap adjacent elements
- **Direction**: 4-directional (up, down, left, right)

### 2.3 Match Rules
- **Standard Match**: 3+ elements in a row/column
- **L-Shape Match**: Supported
- **T-Shape Match**: Supported

### 2.4 Special Elements
| Match Type | Special Element Created | Effect |
|------------|------------------------|--------|
| 4-match | Bomb Gem | 3x3 area explosion |
| 5-match | Rainbow Ball | Clears all elements of selected type |

---

## 3. Level System

### 3.1 Level Configuration
- **Total Levels**: 50
- **Difficulty Curve**: Progressive

### 3.2 Level Objectives (Mixed Types)
- Score Target
- Collect Specific Elements
- Clear Obstacles

### 3.3 Step Limit Per Level
| Level Range | Steps |
|-------------|-------|
| 1-10 | 30 steps |
| 11-25 | 25 steps |
| 26-40 | 20 steps |
| 41-50 | 15 steps |

---

## 4. Obstacle System

| Obstacle | Description | Clear Method |
|----------|-------------|--------------|
| Ice | Frozen element | Match the frozen element |
| Chain | Locked element | Match adjacent elements |
| Stone | Immovable block | Adjacent explosions (2 hits) |

---

## 5. Props System

| Prop | Effect | Usage |
|------|--------|-------|
| Shuffle | Randomize board | 1 per level |
| Bomb | Clear 3x3 area | Player choice |
| Hammer | Remove single element | Player choice |
| +5 Steps | Add 5 moves | Extend gameplay |

---

## 6. Save System

- **Method**: Local Storage (localStorage)
- **Data**: Level progress, scores, settings

---

## 7. Audio System

### 7.1 Sound Effects
- Match sounds
- Special element activation
- Level complete/fail
- UI interactions

### 7.2 Background Music
- Menu BGM
- Gameplay BGM
- Victory/Defeat BGM

### 7.3 Technical
- Web Audio API implementation
- Volume control
- Mute toggle

---

## 8. Technical Specifications

### 8.1 Technology Stack
- **Frontend**: HTML5 Canvas + JavaScript (ES6+)
- **No Framework**: Vanilla JS for performance

### 8.2 Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### 8.3 Performance Requirements
- 60 FPS gameplay
- Touch and mouse input support
- Responsive layout

---

## 9. UI/UX Requirements

### 9.1 Screens
- Main Menu
- Level Selection
- Gameplay
- Pause Menu
- Level Complete
- Settings

### 9.2 Visual Feedback
- Element selection highlight
- Match animation
- Cascade animation
- Score popup

---

## 10. Acceptance Criteria

- [ ] Core match-3 mechanics working
- [ ] All 50 levels playable
- [ ] Special elements functional
- [ ] Obstacles working correctly
- [ ] Props system operational
- [ ] Save/load functional
- [ ] Audio working
- [ ] Responsive design
- [ ] 60 FPS performance
- [ ] Anime-style assets applied

---

**Confirmed by**: User
**Confirmation Date**: 2026-02-20
