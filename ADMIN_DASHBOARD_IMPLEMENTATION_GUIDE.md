# Admin Dashboard Design System Implementation Guide

This guide provides step-by-step instructions to align your Admin Dashboard (`internal/admin/templates/`) with the Brancr Landing Page design system.

## 🎯 Quick Start (5 Minutes)

### Step 1: Update CSS Variables in `layout.html`

Find your CSS variables section (usually in `<style>` tag or external CSS file) and update:

```css
:root {
  /* CHANGE THIS */
  --accent: #635BFF;  /* Was: #2563eb */
  
  /* UPDATE THESE */
  --primary: #1B1A55;
  --primary-dark: #0A034B;
  --accent-light: #5E5CE6;
  
  /* ADD THESE */
  --accent-opacity-10: rgba(99, 91, 255, 0.1);
  --accent-opacity-20: rgba(99, 91, 255, 0.2);
  --accent-opacity-30: rgba(99, 91, 255, 0.3);
}
```

### Step 2: Add Inter Font to `<head>`

Add this before closing `</head>` tag:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
```

### Step 3: Update Body Font

In your CSS or `<style>` tag:

```css
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### Step 4: Update Border Radius

Replace existing border-radius values:
- `8px` → `12px` (buttons, inputs)
- `12px` → `16px` (small cards)
- `16px` → `24px` (large cards)

### Step 5: Update Primary Button Styles

Find your primary button CSS and update:

```css
.btn-primary {
  background: var(--accent);        /* Now uses violet */
  color: white;
  border-radius: 12px;              /* Updated */
  box-shadow: 0 10px 25px rgba(99, 91, 255, 0.3);  /* Violet shadow */
  transition: all 0.2s;
}

.btn-primary:hover {
  background: var(--accent-light);  /* #5E5CE6 */
  transform: translateY(-1px);
}
```

---

## 📋 Complete Implementation Checklist

### ✅ Priority 1: Critical Design System

- [ ] **Update CSS Variables**
  - [ ] Change `--accent` from `#2563eb` to `#635BFF`
  - [ ] Add `--accent-light: #5E5CE6`
  - [ ] Add accent opacity variables
  - [ ] Verify `--primary: #1B1A55`

- [ ] **Add Inter Font**
  - [ ] Add Google Fonts link in `<head>`
  - [ ] Update `body { font-family }` to use Inter
  - [ ] Test font loading

- [ ] **Update Color References**
  - [ ] Find all instances of `#2563eb` (blue)
  - [ ] Replace with `#635BFF` or `var(--accent)`
  - [ ] Update active nav item colors
  - [ ] Update link colors
  - [ ] Update focus states

### ✅ Priority 2: Visual Updates

- [ ] **Border Radius**
  - [ ] Buttons: `8px` → `12px`
  - [ ] Cards: `12px` → `16px` (small), `24px` (large)
  - [ ] Inputs: `8px` → `12px`

- [ ] **Shadows**
  - [ ] Cards: Add hover shadow effect
  - [ ] Buttons: Add primary shadow with violet tint
  - [ ] Update shadow variables

- [ ] **Spacing**
  - [ ] Page headers: Add 40px bottom margin
  - [ ] Grid gaps: Use 24px
  - [ ] Card padding: Use 24px (standard) or 40px (hero)

### ✅ Priority 3: Components

- [ ] **Buttons**
  - [ ] Update primary button to use violet
  - [ ] Add hover transform effect
  - [ ] Add shadow

- [ ] **Cards**
  - [ ] Update border radius to 24px
  - [ ] Add hover lift effect
  - [ ] Update shadow

- [ ] **Badges**
  - [ ] Update to rounded-full (9999px)
  - [ ] Add uppercase tracking
  - [ ] Update info badge to use accent color

- [ ] **Navigation**
  - [ ] Active state: Use `var(--accent)` background
  - [ ] Hover state: Add accent-colored background

- [ ] **Forms**
  - [ ] Focus states: Use accent color border
  - [ ] Focus ring: Use accent opacity-10
  - [ ] Update border radius

### ✅ Priority 4: Page-Specific

- [ ] **Dashboard Page**
  - [ ] Update stat cards
  - [ ] Update chart colors (if any)
  - [ ] Update "Quick Actions" section

- [ ] **Login Page**
  - [ ] Update primary button
  - [ ] Update branding colors
  - [ ] Match form styling

- [ ] **All Other Pages**
  - [ ] Verify accent color usage
  - [ ] Update border radius
  - [ ] Update shadows

---

## 🎨 Color Mapping Reference

### Replace These Colors:

| Old (Current) | New (Landing Page) | Usage |
|--------------|-------------------|-------|
| `#2563eb` | `#635BFF` | Primary accent, buttons, links |
| `#3b82f6` | `#635BFF` | Info badges, active states |
| `rgba(37, 99, 235, 0.1)` | `rgba(99, 91, 255, 0.1)` | Background tints |
| `rgba(37, 99, 235, 0.3)` | `rgba(99, 91, 255, 0.3)` | Shadows |

### Keep These Colors:

- `#0A034B` - Primary dark (keep)
- `#1B1A55` - Primary (update if needed)
- `#F9FAFB` - Background (keep)
- All status colors (success, error, warning) - keep as-is

---

## 📝 File Structure to Update

Assuming your admin dashboard structure:

```
internal/
  admin/
    templates/
      layout.html          ← MAIN FILE - Update CSS variables here
      dashboard.html       ← Update stat cards, colors
      login.html          ← Update buttons, form styles
      tenants.html        ← Update table styles, buttons
      integrations.html   ← Update card styles
      ...
    static/
      css/
        admin.css         ← Update if using external CSS file
```

---

## 🔍 Finding Files to Update

### Search for These Patterns:

**In HTML templates:**
```bash
# Find all instances of blue color
grep -r "#2563eb" internal/admin/templates/
grep -r "#3b82f6" internal/admin/templates/
grep -r "rgb(37, 99, 235" internal/admin/templates/

# Find CSS variables
grep -r "--accent" internal/admin/templates/
grep -r "var(--accent)" internal/admin/templates/
```

**In CSS files:**
```bash
# Find button styles
grep -r "\.btn-primary" internal/admin/static/css/
grep -r "button.primary" internal/admin/static/css/

# Find active nav styles
grep -r "\.active" internal/admin/static/css/
grep -r "nav.*active" internal/admin/static/css/
```

---

## 💡 Common Patterns to Replace

### Pattern 1: Button Colors

**Before:**
```css
.btn-primary {
  background: #2563eb;  /* Blue */
}
```

**After:**
```css
.btn-primary {
  background: var(--accent);  /* #635BFF - Violet */
}
```

### Pattern 2: Active Navigation

**Before:**
```css
nav a.active {
  background: #2563eb;  /* Blue */
}
```

**After:**
```css
nav a.active {
  background: var(--accent);  /* #635BFF - Violet */
  color: white;
}
```

### Pattern 3: Focus States

**Before:**
```css
input:focus {
  border-color: #2563eb;  /* Blue */
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
```

**After:**
```css
input:focus {
  border-color: var(--accent);  /* #635BFF - Violet */
  box-shadow: 0 0 0 3px var(--accent-opacity-10);
}
```

### Pattern 4: Border Radius

**Before:**
```css
.card {
  border-radius: 8px;  /* Small */
}
```

**After:**
```css
.card {
  border-radius: 24px;  /* Large - rounded-3xl */
}
```

### Pattern 5: Shadows

**Before:**
```css
.card {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

**After:**
```css
.card {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  transition: all 0.2s;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
```

---

## 🧪 Testing Checklist

After implementing changes:

- [ ] **Visual Check:**
  - [ ] All buttons are violet (not blue)
  - [ ] Active nav items are violet
  - [ ] Links are violet
  - [ ] Focus states use violet ring

- [ ] **Font Check:**
  - [ ] Inter font is loading
  - [ ] All text uses Inter
  - [ ] Font weights display correctly

- [ ] **Components Check:**
  - [ ] Border radius matches (12px/16px/24px)
  - [ ] Shadows look correct
  - [ ] Hover effects work
  - [ ] Cards lift on hover

- [ ] **Responsive Check:**
  - [ ] Mobile layout works
  - [ ] Tablet layout works
  - [ ] Desktop layout works

- [ ] **Pages Check:**
  - [ ] Dashboard page
  - [ ] Login page
  - [ ] Tenants page
  - [ ] Integrations page
  - [ ] Settings page

---

## 📦 Complete CSS File

See `ADMIN_DASHBOARD_DESIGN_SYSTEM.css` for the complete CSS file with all styles, variables, and components ready to use.

You can either:
1. **Copy the entire file** and link it in your `layout.html`
2. **Extract sections** you need (variables, buttons, cards, etc.)
3. **Reference it** as a style guide

---

## 🚀 Quick Implementation Script

If you want to quickly update all files:

```bash
# Navigate to your admin templates directory
cd internal/admin/templates/

# Replace all instances of blue accent with violet
sed -i 's/#2563eb/#635BFF/g' *.html
sed -i 's/#3b82f6/#635BFF/g' *.html
sed -i 's/rgb(37, 99, 235)/rgb(99, 91, 255)/g' *.html

# Replace border-radius values (be careful with this)
sed -i 's/border-radius: 8px/border-radius: 12px/g' *.html
sed -i 's/border-radius: 12px/border-radius: 16px/g' *.html
sed -i 's/border-radius: 16px/border-radius: 24px/g' *.html
```

**⚠️ Warning:** Always review changes after using sed, as it may affect unintended matches.

---

## 📞 Need Help?

If you need to verify specific values or see examples from the landing page:

1. **Colors:** Check `tailwind.config.ts` in the landing page repo
2. **Fonts:** Check `app/globals.css` for Inter font setup
3. **Components:** Check `app/(tenant)/app/*/page.tsx` for component examples
4. **Styles:** Check any `.tsx` file for TailwindCSS class usage

---

## ✅ Summary

**Critical Changes:**
1. Accent color: `#2563eb` → `#635BFF`
2. Font: System fonts → Inter from Google Fonts
3. Border radius: `8px/12px` → `12px/16px/24px`
4. Shadows: Basic → Enhanced with hover effects
5. Hover states: Add transform and shadow changes

**Time Estimate:**
- Quick fixes (CSS variables + font): 10 minutes
- Full implementation (all components): 1-2 hours
- Complete alignment (all pages): 2-4 hours

