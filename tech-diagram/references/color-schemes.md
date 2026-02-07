# Color Schemes

## Dark Theme (Default)

Background gradient:
```css
background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
```

### Primary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Primary | `#00acc1` | 0, 172, 193 | Main accent, active states |
| Primary Light | `#26c6da` | 38, 198, 218 | Hover, borders |
| Primary Dark | `#0097a7` | 0, 151, 167 | Gradients |

### Status Colors

| Name | Hex | Usage |
|------|-----|-------|
| Success | `#48bb78` | Complete, passed |
| Success Light | `#68d391` | Success borders |
| Warning | `#f6ad55` | Running, waiting |
| Warning Light | `#fbd38d` | Warning borders |
| Error | `#f56565` | Failed, error |
| Error Light | `#fc8181` | Error borders |

### Special Colors

| Name | Hex | Usage |
|------|-----|-------|
| Purple | `#9f7aea` | Loop, iteration |
| Purple Light | `#b794f4` | Purple borders |
| Yellow | `#f6e05e` | Data packet, slot |

### Neutral Colors

| Name | Hex | Usage |
|------|-----|-------|
| Box Fill | `#2d3748` | Default component fill |
| Box Stroke | `#4a5568` | Default component border |
| Text Primary | `#a0aec0` | Main text |
| Text Secondary | `#718096` | Sub labels |
| Background | `rgba(255,255,255,0.05)` | Section backgrounds |

---

## Alternative Themes

### Green Theme (Success-focused)
```css
:root {
    --primary: #48bb78;
    --primary-light: #68d391;
    --primary-dark: #38a169;
    --primary-rgb: 72, 187, 120;
}
```

### Orange Theme (Warning-focused)
```css
:root {
    --primary: #ed8936;
    --primary-light: #f6ad55;
    --primary-dark: #dd6b20;
    --primary-rgb: 237, 137, 54;
}
```

### Purple Theme (Creative)
```css
:root {
    --primary: #805ad5;
    --primary-light: #9f7aea;
    --primary-dark: #6b46c1;
    --primary-rgb: 128, 90, 213;
}
```

### Blue Theme (Professional)
```css
:root {
    --primary: #4299e1;
    --primary-light: #63b3ed;
    --primary-dark: #3182ce;
    --primary-rgb: 66, 153, 225;
}
```

---

## Semantic Color Mapping

### State Transitions
```
idle     → #2d3748 (gray)
active   → --primary (cyan)
running  → --warning (orange)
complete → --success (green)
error    → --error (red)
skipped  → #718096 (dim gray, 50% opacity)
```

### Data Flow
```
data packet → #f6e05e (yellow)
data slot   → rgba(246, 224, 94, 0.2) fill + #f6e05e stroke
```

### Component Types
```
standard  → #2d3748 fill + #4a5568 stroke
condition → diamond shape + same colors
loop      → dashed stroke + --purple
parallel  → dashed stroke + --primary
```

---

## SVG Filter Effects

### Glow Effect
```css
filter: drop-shadow(0 0 8px rgba(var(--primary-rgb), 0.5));
```

### Usage Examples
```css
.box.active {
    fill: var(--primary);
    stroke: var(--primary-light);
    filter: drop-shadow(0 0 8px rgba(var(--primary-rgb), 0.5));
}
```
