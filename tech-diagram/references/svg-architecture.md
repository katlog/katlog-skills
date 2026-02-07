# SVG Architecture Patterns

## Basic Components

### Rectangle Box (组件盒子)
```svg
<g id="component-name">
    <rect class="box" x="10" y="20" width="80" height="40" rx="5"/>
    <text class="box-label" x="50" y="45" text-anchor="middle">Name</text>
</g>
```

### With Subtitle
```svg
<g id="component">
    <rect class="box" x="10" y="20" width="100" height="50" rx="5"/>
    <text class="box-label" x="60" y="40" text-anchor="middle">Title</text>
    <text class="small-label" x="60" y="55" text-anchor="middle">subtitle</text>
</g>
```

### Circle (Start/End)
```svg
<g id="start">
    <circle class="box" cx="40" cy="40" r="16"/>
    <text class="box-label" x="40" y="44" text-anchor="middle">Start</text>
</g>
```

### Diamond (Condition)
```svg
<g id="condition">
    <polygon class="diamond" points="50,20 80,50 50,80 20,50"/>
    <text x="50" y="54" text-anchor="middle" fill="#a0aec0" font-size="9">IF</text>
</g>
```

---

## Arrows

### Basic Arrow
```svg
<defs>
    <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
        <polygon points="0 0, 8 3, 0 6" fill="#4a5568"/>
    </marker>
</defs>
<path class="arrow" d="M100,50 L150,50" marker-end="url(#arrowhead)"/>
```

### Curved Arrow
```svg
<path class="arrow" d="M100,50 Q125,30 150,50"/>
```

### Multi-segment Arrow
```svg
<path class="arrow" d="M100,50 L120,50 L120,80 L150,80"/>
```

### Branch Labels
```svg
<path class="arrow" d="M80,50 L100,30"/>
<text x="90" y="28" fill="#48bb78" font-size="8">true</text>

<path class="arrow" d="M80,50 L100,70"/>
<text x="90" y="82" fill="#ed8936" font-size="8">false</text>
```

---

## Containers

### Section Box
```svg
<rect x="10" y="10" width="400" height="150" rx="8"
      fill="rgba(0,172,193,0.1)" stroke="#00acc1" stroke-width="1"/>
<text x="20" y="28" fill="#00acc1" font-size="10" font-weight="bold">Section Title</text>
```

### Dashed Container (Loop/Parallel)
```svg
<rect x="10" y="10" width="200" height="100" rx="5"
      fill="none" stroke="#9f7aea" stroke-width="2" stroke-dasharray="5,3"/>
<text x="110" y="25" text-anchor="middle" fill="#9f7aea" font-size="9">Iterator x3</text>
```

### Thread Pool
```svg
<rect x="10" y="10" width="100" height="120" rx="4"
      fill="rgba(66,153,225,0.1)" stroke="#4299e1" stroke-width="1.5" stroke-dasharray="4,2"/>
<text x="60" y="25" text-anchor="middle" fill="#4299e1" font-size="8">Thread Pool</text>

<!-- Worker threads -->
<rect x="20" y="35" width="80" height="20" rx="3" fill="rgba(66,153,225,0.2)" stroke="#63b3ed"/>
<text x="60" y="48" text-anchor="middle" fill="#a0aec0" font-size="7">Worker 1</text>
```

---

## Data Flow

### Data Packet
```svg
<circle class="packet" id="packet1" cx="50" cy="50" r="4" opacity="0"/>
```

### Slot/Context Box
```svg
<rect x="10" y="10" width="80" height="60" rx="4"
      fill="rgba(246,224,94,0.2)" stroke="#f6e05e" stroke-width="1.5"/>
<text x="50" y="28" text-anchor="middle" fill="#f6e05e" font-size="9">Slot</text>
<text x="50" y="42" text-anchor="middle" fill="#d69e2e" font-size="7">requestData</text>
<text x="50" y="54" text-anchor="middle" fill="#d69e2e" font-size="7">responseData</text>
```

### Variable Reference Line
```svg
<path class="var-ref" d="M100,80 Q150,120 200,80"
      stroke="#9f7aea" stroke-width="1.5" stroke-dasharray="4,2" fill="none"/>
```

---

## Queue Components

### Task Queue
```svg
<rect x="10" y="10" width="80" height="100" rx="5"
      fill="rgba(246,173,85,0.1)" stroke="#f6ad55" stroke-width="2"/>
<text x="50" y="25" text-anchor="middle" fill="#f6ad55" font-size="9">TaskQueue</text>

<!-- Queue items -->
<rect class="queue-item" x="18" y="35" width="64" height="18" rx="3"
      fill="#4a5568" stroke="#718096" stroke-width="1"/>
<text x="50" y="47" text-anchor="middle" fill="#a0aec0" font-size="8">Task 1</text>
```

### Queue Item States
```css
.queue-item { fill: #4a5568; stroke: #718096; }
.queue-item.waiting { fill: #f6ad55; stroke: #ed8936; }
.queue-item.processing { fill: #00acc1; stroke: #26c6da; }
```

---

## Layout Patterns

### Horizontal Pipeline
```
[A] → [B] → [C] → [D]
```
```svg
<g transform="translate(0,50)">
    <rect class="box" x="10" y="0" width="60" height="30" rx="4"/>
    <path class="arrow" d="M70,15 L90,15"/>
    <rect class="box" x="90" y="0" width="60" height="30" rx="4"/>
    <path class="arrow" d="M150,15 L170,15"/>
    <rect class="box" x="170" y="0" width="60" height="30" rx="4"/>
</g>
```

### Branching (IF)
```
       → [true branch]
[IF] ◇
       → [false branch]
```

### Parallel Merge
```
     [A] ↘
            → [Merge] → [Next]
     [B] ↗
```

### Layer Architecture
```
┌─────────────────────────┐
│   Presentation Layer    │
├─────────────────────────┤
│    Business Layer       │
├─────────────────────────┤
│      Data Layer         │
└─────────────────────────┘
```

---

## Animation Helpers

### State Toggle
```javascript
function activateBox(id) {
    document.querySelector('#' + id + ' .box').classList.add('active');
}

function completeBox(id) {
    const el = document.querySelector('#' + id + ' .box');
    el.classList.remove('active', 'running');
    el.classList.add('complete');
}
```

### Packet Animation
```javascript
function movePacket(id, x, y) {
    const el = document.getElementById(id);
    anime({
        targets: el,
        cx: x,
        cy: y !== undefined ? y : el.getAttribute('cy'),
        duration: 300,
        easing: 'easeOutQuad'
    });
}
```

### Batch State Change
```javascript
anime({
    targets: ['#node1', '#node2', '#node3'],
    fill: '#48bb78',
    stroke: '#68d391',
    duration: 400,
    delay: anime.stagger(100)  // 100ms between each
});
```
