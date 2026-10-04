# 🌓 Dark Mode / Light Mode — Complete Guide

## ✅ បានបង្កើតរួច

### ឯកសារដែលបានបង្កើត:

1. **`src/components/ui/ThemeToggle.tsx`** - Theme Toggle Component
   - Component មានពីរប្រភេទ:
     - `ThemeToggle`: ពេញលេញជាមួយ dropdown (Light, Dark, Auto)
     - `QuickThemeToggle`: ប៊ូតុងសាមញ្ញ toggle រវាង dark និង light

2. **`public/css/light-theme.css`** - Light Mode Stylesheet
   - ពណ៌ទាំងអស់សម្រាប់ Light Mode
   - Override dark mode colors
   - Smooth transitions

### 🎨 ពណ៌ Light Mode

#### Background Colors
```css
--bg-app: #f8fafc;          /* ផ្ទៃខាងក្រោយសរុប */
--bg-header: #ffffff;        /* Header */
--bg-sidebar: #ffffff;       /* Sidebar */
--bg-panel: #ffffff;         /* Panels */
--bg-input: #f8fafc;         /* Input fields */
```

#### Text Colors
```css
--text-primary: #0f172a;     /* ពណ៌អក្សរមេ */
--text-secondary: #475569;   /* ពណ៌អក្សររង */
--text-muted: #64748b;       /* ពណ៌ស្រាលៗ */
```

#### Accent Colors (រក្សាពណ៌ភ្លឺ)
```css
--accent-cyan: #0ea5e9;
--accent-emerald: #059669;
--accent-violet: #7c3aed;
--accent-purple: #a855f7;
--accent-amber: #d97706;
--accent-rose: #e11d48;
```

---

## 📖 របៀបប្រើ

### 1. បញ្ចូលក្នុង App.tsx

```tsx
import { ThemeToggle, QuickThemeToggle } from './components/ui/ThemeToggle';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme_mode');
    if (saved === 'light') return false;
    if (saved === 'dark') return true;
    // Auto: check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleThemeChange = (theme: 'light' | 'dark') => {
    setIsDarkMode(theme === 'dark');
  };

  return (
    <div>
      {/* Full Theme Toggle with Dropdown */}
      <ThemeToggle 
        currentTheme={isDarkMode ? 'dark' : 'light'}
        onThemeChange={handleThemeChange}
      />

      {/* OR Quick Toggle Button */}
      <QuickThemeToggle
        currentTheme={isDarkMode ? 'dark' : 'light'}
        onThemeChange={handleThemeChange}
      />
    </div>
  );
}
```

### 2. បញ្ចូលក្នុង Header.tsx

អ្នកអាចបន្ថែមនៅក្នុង Header component:

```tsx
// In Header.tsx
import { ThemeToggle } from '../ui/ThemeToggle';

export const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  onToggleDarkMode,
  // ... other props
}) => {
  return (
    <header className="studio-header">
      {/* ... other header content */}
      
      <div className="header-right-zone">
        <ThemeToggle
          currentTheme={isDarkMode ? 'dark' : 'light'}
          onThemeChange={(theme) => onToggleDarkMode?.(theme === 'dark')}
        />
        {/* ... other buttons */}
      </div>
    </header>
  );
};
```

---

## 🎯 មុខងារ (Features)

### ThemeToggle (Full Version)
- ✅ 3 Options: Light, Dark, Auto
- ✅ Dropdown menu with icons
- ✅ Active state indicators
- ✅ Smooth animations
- ✅ Save preference to localStorage
- ✅ Auto mode follows system preference

### QuickThemeToggle (Simple Version)
- ✅ Quick toggle button
- ✅ Sun/Moon icon
- ✅ Rotate animation on click
- ✅ Minimal design

---

## 🔄 Auto Mode

Auto mode តាមប្រព័ន្ធប្រតិបត្តិការ:

```tsx
// Auto mode listens to system preference
if (mode === 'auto') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const autoTheme = mediaQuery.matches ? 'dark' : 'light';
  
  // Update when system preference changes
  mediaQuery.addEventListener('change', (e) => {
    onThemeChange(e.matches ? 'dark' : 'light');
  });
}
```

---

## 🎨 Styling Components

### ប្រើ CSS Variables

```tsx
// ប្រើក្នុង inline styles
<div style={{
  background: 'var(--bg-panel)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-color)',
}}>
  Content
</div>
```

### ប្រើ Tailwind Classes with Dark Mode

```tsx
// Tailwind dark mode classes
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  Content
</div>
```

---

## 📝 Examples

### Example 1: Card Component

```tsx
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass-card" style={{
      padding: '16px',
      borderRadius: 'var(--radius-lg)',
      // CSS variables work in both themes
    }}>
      {children}
    </div>
  );
}
```

### Example 2: Button with Theme

```tsx
function ThemedButton({ onClick, children }: any) {
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains('dark')
  );

  return (
    <button
      onClick={onClick}
      style={{
        background: isDark 
          ? 'rgba(255, 255, 255, 0.1)' 
          : 'rgba(0, 0, 0, 0.1)',
        color: 'var(--text-primary)',
      }}
    >
      {children}
    </button>
  );
}
```

---

## 🔧 Customization

### បន្ថែមពណ៌ខ្លួនឯង

```css
/* In light-theme.css */
.light {
  --custom-primary: #your-color;
  --custom-secondary: #your-color;
}

/* In dark theme (modern-ui-system.css or style.css) */
:root {
  --custom-primary: #your-dark-color;
  --custom-secondary: #your-dark-color;
}
```

### Override Specific Components

```css
/* Light mode specific styles */
.light .your-component {
  background: white;
  color: black;
}

/* Dark mode specific styles */
.dark .your-component {
  background: #1e293b;
  color: white;
}
```

---

## ⚡ Performance

### Smooth Transitions

```css
/* In light-theme.css */
.light,
.light * {
  transition: background-color 0.3s ease, 
              color 0.3s ease, 
              border-color 0.3s ease;
}

/* Exclude elements that shouldn't transition */
.light .no-transition,
.light .video-player,
.light .timeline-playhead {
  transition: none !important;
}
```

---

## 📱 Mobile Support

Theme toggle responsive:

```tsx
// In Header or Settings
<div className="hidden md:block">
  <ThemeToggle {...props} />
</div>

<div className="md:hidden">
  <QuickThemeToggle {...props} />
</div>
```

---

## 🐛 Troubleshooting

### Theme មិនផ្លាស់ប្តូរ

```tsx
// Check if classes are applied
console.log(document.documentElement.classList); // Should show 'dark' or 'light'

// Force update
document.documentElement.classList.remove('dark', 'light');
document.documentElement.classList.add(isDarkMode ? 'dark' : 'light');
```

### CSS មិនដំណើរការ

```html
<!-- Verify CSS is loaded -->
<link rel="stylesheet" href="/css/light-theme.css">

<!-- Check browser console for 404 errors -->
```

### localStorage មិនរក្សា

```tsx
// Ensure save is called
localStorage.setItem('theme_mode', 'light'); // or 'dark' or 'auto'

// Check if saved
const saved = localStorage.getItem('theme_mode');
console.log('Saved theme:', saved);
```

---

## 📚 Complete Integration Example

```tsx
// App.tsx - Complete Example
import React, { useState, useEffect } from 'react';
import { ThemeToggle } from './components/ui/ThemeToggle';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';

export const App: React.FC = () => {
  // Initialize theme from localStorage or system preference
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedMode = localStorage.getItem('theme_mode');
    
    if (savedMode === 'light') return false;
    if (savedMode === 'dark') return true;
    
    // Auto mode: follow system
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleThemeChange = (theme: 'light' | 'dark') => {
    setIsDarkMode(theme === 'dark');
  };

  return (
    <div className="studio-app">
      <Header
        isDarkMode={isDarkMode}
        onToggleDarkMode={(dark: boolean) => setIsDarkMode(dark)}
        // ... other props
      />
      
      <div className="studio-body">
        <Sidebar
          // ... props
        />
        
        <main className="studio-workspace">
          {/* Your content */}
        </main>
      </div>
    </div>
  );
};
```

---

## 🎨 Visual Preview

### Dark Mode (Default)
```
┌─────────────────────────────────┐
│ ●●● VOXCPM2KHMER PRO         🌙 │ ← Dark header
├─────────────────────────────────┤
│ [Dark sidebar with dark panels] │
│ Dark timeline, dark cards       │
│ ងងឹត និងស្រួល                 │
└─────────────────────────────────┘
```

### Light Mode
```
┌─────────────────────────────────┐
│ ●●● VOXCPM2KHMER PRO         ☀️ │ ← White header
├─────────────────────────────────┤
│ [White sidebar, light panels]   │
│ Light timeline, bright cards    │
│ ភ្លឺ និងស្អាត                   │
└─────────────────────────────────┘
```

---

## ✅ Checklist

ធ្វើឱ្យប្រាកដថា:

- [x] `ThemeToggle.tsx` បានបង្កើត
- [x] `light-theme.css` បានបង្កើត
- [x] `light-theme.css` included in `index.html`
- [ ] បញ្ចូល ThemeToggle ក្នុង Header
- [ ] បន្ថែម isDarkMode state ក្នុង App
- [ ] Test dark → light switching
- [ ] Test light → dark switching
- [ ] Test auto mode
- [ ] Test localStorage persistence
- [ ] Test all components in both modes

---

## 🚀 Next Steps

1. **បញ្ចូល ThemeToggle ក្នុង Header**
   ```tsx
   // Add to Header.tsx props
   isDarkMode?: boolean;
   onToggleDarkMode?: (dark: boolean) => void;
   ```

2. **Update App.tsx**
   - Add theme state management
   - Pass props to Header
   - Apply theme class to document

3. **Test All Components**
   - Sidebar
   - Modals
   - Timeline
   - Character Library
   - Audio Mixer
   - Subtitle Studio

4. **Optional: Add Keyboard Shortcut**
   ```tsx
   // Ctrl/Cmd + Shift + L to toggle theme
   useEffect(() => {
     const handleKeyPress = (e: KeyboardEvent) => {
       if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
         setIsDarkMode(prev => !prev);
       }
     };
     window.addEventListener('keydown', handleKeyPress);
     return () => window.removeEventListener('keydown', handleKeyPress);
   }, []);
   ```

---

**🌟 រួចរាល់! អ្នកឥឡូវមាន Dark Mode និង Light Mode ពេញលេញ!**

ប្រសិនបើមានសំណួរ សូមពិនិត្យឯកសារនេះ ឬពិនិត្យកូដក្នុង:
- `src/components/ui/ThemeToggle.tsx`
- `public/css/light-theme.css`
