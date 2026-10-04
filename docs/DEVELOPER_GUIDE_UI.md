# Developer Guide — Modern UI System

## 🚀 Quick Start

### Using the Modern UI System

1. **CSS is already integrated** in `public/index.html`:
```html
<link rel="stylesheet" href="/css/modern-ui-system.css">
```

2. **Import reusable components**:
```tsx
import { ModernModal, ModernButton, ModernInput, ModernSelect } from '@/components/ui/ModernModal';
```

---

## 📦 Component Reference

### ModernModal

Reusable modal wrapper with consistent styling.

```tsx
<ModernModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  icon={<Settings size={20} />}
  size="md"  // sm | md | lg | xl | full
  glowColor="cyan"  // cyan | purple | emerald | amber | rose
  closeOnOverlayClick={true}
  showCloseButton={true}
  footer={
    <>
      <ModernButton variant="secondary" onClick={handleCancel}>
        Cancel
      </ModernButton>
      <ModernButton variant="primary" onClick={handleSave}>
        Save
      </ModernButton>
    </>
  }
>
  {/* Your content here */}
</ModernModal>
```

**Props:**
- `isOpen: boolean` - Controls visibility
- `onClose: () => void` - Called when modal closes
- `title: string` - Modal title
- `icon?: React.ReactNode` - Optional icon in header
- `size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'` - Modal width
- `glowColor?: 'cyan' | 'purple' | 'emerald' | 'amber' | 'rose'` - Accent color
- `closeOnOverlayClick?: boolean` - Allow closing by clicking backdrop
- `showCloseButton?: boolean` - Show X button
- `footer?: React.ReactNode` - Optional footer content

---

### ModernButton

Styled button with variants and states.

```tsx
<ModernButton
  variant="primary"  // primary | secondary | success | danger | ghost
  size="md"  // sm | md | lg
  onClick={handleClick}
  disabled={false}
  loading={isLoading}
  icon={<Save size={16} />}
  fullWidth={false}
>
  Save Changes
</ModernButton>
```

**Props:**
- `variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost'`
- `size?: 'sm' | 'md' | 'lg'`
- `disabled?: boolean`
- `loading?: boolean` - Shows spinner
- `icon?: React.ReactNode`
- `fullWidth?: boolean`

**Variants:**
- **primary**: Blue gradient, high emphasis
- **secondary**: Subtle background, medium emphasis
- **success**: Green gradient, positive actions
- **danger**: Red gradient, destructive actions
- **ghost**: Transparent, minimal emphasis

---

### ModernInput

Styled input field with focus states.

```tsx
<ModernInput
  label="Email Address"
  placeholder="Enter your email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  type="email"
  error={emailError}
  icon={<Mail size={16} />}
  fullWidth={true}
/>
```

**Props:**
- `label?: string` - Field label
- `error?: string` - Error message
- `icon?: React.ReactNode` - Left icon
- `fullWidth?: boolean`
- `...HTMLInputAttributes` - All standard input props

---

### ModernSelect

Styled select dropdown.

```tsx
<ModernSelect
  label="Choose Voice"
  value={selectedVoice}
  onChange={(e) => setSelectedVoice(e.target.value)}
  options={[
    { value: 'voice1', label: 'Male Voice 1' },
    { value: 'voice2', label: 'Female Voice 1' },
  ]}
  error={voiceError}
  fullWidth={true}
/>
```

**Props:**
- `label?: string`
- `error?: string`
- `options: Array<{ value: string; label: string }>`
- `fullWidth?: boolean`
- `...HTMLSelectAttributes`

---

## 🎨 CSS Classes Reference

### Glassmorphism

```css
.glass-panel {
  background: rgba(17, 24, 39, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-card {
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```

### Animation Utilities

```css
.fade-in { animation: fadeIn 0.3s ease; }
.slide-up { animation: slideUp 0.3s ease; }
.scale-in { animation: scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
```

### Scrollbar

```css
.modern-scrollbar::-webkit-scrollbar { width: 8px; }
.modern-scrollbar::-webkit-scrollbar-thumb { 
  background: rgba(255, 255, 255, 0.12);
  border-radius: 4px;
}
```

---

## 🎯 CSS Variables

### Colors

```css
/* Accents */
--accent-cyan: #38bdf8;
--accent-emerald: #10b981;
--accent-violet: #818cf8;
--accent-purple: #c084fc;
--accent-amber: #f59e0b;
--accent-rose: #f43f5e;

/* Backgrounds */
--bg-app: #07090e;
--bg-header: #0b0f19;
--bg-sidebar: #090d15;
--bg-panel: #111827;
--bg-input: #0b0f19;

/* Text */
--text-primary: #f8fafc;
--text-secondary: #94a3b8;
--text-muted: #64748b;

/* Borders */
--border-subtle: rgba(255, 255, 255, 0.06);
--border-color: rgba(255, 255, 255, 0.1);
--border-focus: #38bdf8;
```

### Spacing

```css
--sidebar-width: 240px;
--sidebar-collapsed-width: 64px;
--header-height: 52px;
--timeline-height: 270px;
```

### Radius

```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
```

---

## 💡 Common Patterns

### Creating a Card with Hover Effect

```tsx
<div className="glass-card" style={{
  padding: '16px',
  borderRadius: 'var(--radius-lg)',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
}}
onMouseEnter={(e) => {
  e.currentTarget.style.transform = 'translateY(-4px)';
  e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.5)';
}}
onMouseLeave={(e) => {
  e.currentTarget.style.transform = 'translateY(0)';
  e.currentTarget.style.boxShadow = 'none';
}}
>
  Card content
</div>
```

### Progress Bar

```tsx
<div className="progress-bar-container" style={{
  width: '100%',
  height: '8px',
  background: 'rgba(0, 0, 0, 0.3)',
  borderRadius: '4px',
  overflow: 'hidden',
}}>
  <div className="progress-bar-fill" style={{
    width: `${progress}%`,
    height: '100%',
    background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-violet))',
    transition: 'width 0.3s ease',
  }} />
</div>
```

### Loading Spinner

```tsx
<div className="spinner" style={{
  width: '32px',
  height: '32px',
  border: '3px solid rgba(255, 255, 255, 0.1)',
  borderTopColor: 'var(--accent-cyan)',
  borderRadius: '50%',
  animation: 'spin 0.6s linear infinite',
}} />

<style>{`
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`}</style>
```

### Toast Notification

```tsx
function showToast(message: string, type: 'success' | 'error' | 'info' | 'warning') {
  const toast = document.createElement('div');
  toast.className = `toast-item ${type}`;
  toast.textContent = message;
  
  const container = document.getElementById('toastContainer');
  container?.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
```

---

## 🎭 Animation Guidelines

### Timing Functions

```css
/* Fast interactions (hover) */
transition: all 0.15s ease;

/* Standard (most UI) */
transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

/* Slow (complex) */
transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
```

### Transform Best Practices

```css
/* ✅ Good: Hardware accelerated */
transform: translateY(-4px);
transform: scale(1.05);

/* ❌ Avoid: Layout shift */
margin-top: -4px;
width: 105%;
```

### will-change Hint

```css
/* Add to frequently animated elements */
.timeline-playhead {
  will-change: transform;
}

.modal-container {
  will-change: transform, opacity;
}
```

---

## 🔧 Customization

### Changing Accent Color

```tsx
// In your component or theme provider
const accentColor = '#10b981'; // Emerald

<div style={{
  '--accent': accentColor,
  borderColor: 'var(--accent)',
  boxShadow: `0 0 20px ${accentColor}33`,
} as React.CSSProperties}>
  Custom accent content
</div>
```

### Dark/Light Mode Toggle

```tsx
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.classList.contains('dark');
  
  if (isDark) {
    html.classList.remove('dark');
    html.classList.add('light');
  } else {
    html.classList.remove('light');
    html.classList.add('dark');
  }
}
```

---

## 📱 Responsive Design

### Breakpoints

```css
/* Mobile */
@media (max-width: 768px) {
  .sidebar { display: none; }
  .modal-container { width: 95%; }
}

/* Tablet */
@media (max-width: 1024px) {
  .character-library-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

/* Desktop */
@media (min-width: 1025px) {
  /* Full features */
}
```

### Mobile-Friendly Controls

```tsx
// Touch-optimized buttons
<button style={{
  minHeight: '44px',  // iOS touch target
  padding: '12px 24px',
  fontSize: '14px',
}}>
  Touch Friendly
</button>
```

---

## 🎨 Color Palette Reference

### Track Colors (Timeline)

```tsx
const TRACK_COLORS = {
  video: '#00C2FF',    // Cyan
  dubVoice: '#10b981', // Emerald
  origVoice: '#a855f7',// Purple
  bgm: '#f59e0b',      // Amber
  sfx: '#ec4899',      // Pink
  subtitle: '#818cf8', // Indigo
  effects: '#38bdf8',  // Sky
};
```

### Avatar Colors (A-Z)

```tsx
const AVATAR_COLORS = {
  A: '#6366f1', B: '#8b5cf6', C: '#ec4899', D: '#f43f5e',
  E: '#f97316', F: '#eab308', G: '#22c55e', H: '#14b8a6',
  I: '#06b6d4', J: '#3b82f6', K: '#a855f7', L: '#d946ef',
  M: '#10b981', N: '#0ea5e9', O: '#f59e0b', P: '#84cc16',
  Q: '#ef4444', R: '#fb923c', S: '#34d399', T: '#38bdf8',
  U: '#818cf8', V: '#c084fc', W: '#fb7185', X: '#fdba74',
  Y: '#fde047', Z: '#86efac',
};
```

---

## 🐛 Troubleshooting

### Modal not appearing

```tsx
// Check z-index hierarchy
.modal-overlay {
  z-index: 1000;  // Should be highest
}

// Ensure body scroll is locked
useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}, [isOpen]);
```

### Animations not smooth

```css
/* Add hardware acceleration */
.animated-element {
  transform: translateZ(0);
  will-change: transform;
  backface-visibility: hidden;
}
```

### Glassmorphism not working

```css
/* Ensure backdrop-filter support */
.glass {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px); /* Safari */
}

/* Check parent has backdrop content */
/* Glassmorphism requires content behind element */
```

---

## 📚 Further Reading

- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **Lucide Icons**: https://lucide.dev
- **React TypeScript**: https://react-typescript-cheatsheet.netlify.app
- **CSS Animations**: https://developer.mozilla.org/en-US/docs/Web/CSS/animation

---

## 🎯 Best Practices

### Do's ✅

- Use CSS variables for theming
- Leverage hardware-accelerated transforms
- Add loading states to async operations
- Provide visual feedback for interactions
- Use semantic HTML elements
- Keep animations purposeful and subtle
- Test on multiple screen sizes
- Ensure keyboard navigation works

### Don'ts ❌

- Don't animate `width`, `height`, or `margin` (use `transform`)
- Don't use too many simultaneous animations
- Don't forget accessibility (focus states, ARIA)
- Don't hardcode colors (use CSS variables)
- Don't ignore mobile responsiveness
- Don't skip loading states
- Don't use very long animations (>600ms)

---

## 🚀 Performance Tips

1. **Use CSS transforms instead of position changes**
2. **Lazy load heavy components**
3. **Debounce resize/scroll handlers**
4. **Use React.memo for expensive renders**
5. **Keep animation duration under 400ms**
6. **Use will-change sparingly**
7. **Optimize images (WebP, lazy loading)**
8. **Bundle split for modals**

---

## 📝 Code Examples Repository

Check these files for real-world examples:

- **Sidebar**: `src/components/layout/Sidebar.tsx`
- **Modals**: `src/components/ui/ModernModal.tsx`
- **Timeline**: `src/components/timeline/MultiTrackTimeline.tsx`
- **Characters**: `src/components/characters/CharacterLibrary.tsx`
- **Subtitles**: `src/components/subtitles/SubtitleStudio.tsx`
- **Mixer**: `src/components/mixer/AudioMixerConsole.tsx`
- **CSS System**: `public/css/modern-ui-system.css`

---

**Happy coding! 🎨✨**

For questions or issues, refer to the complete documentation in:
- `docs/UI_MODERNIZATION_COMPLETE.md`
- `docs/UI_SHOWCASE.md`
