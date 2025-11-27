# Design Guidelines: Notes Edu Mamae

## Design Approach
Minimal editorial design inspired by premium publishing platforms like Medium and Apple Notes, with a focus on typography-first layouts, generous whitespace, and purposeful use of orange as a statement accent.

## Core Design Principles

**Typography-First Philosophy**
- Primary font: Inter or similar modern sans-serif via Google Fonts
- Display typography: Bold, large-scale headings (48-64px for hero, 32-40px for section headers)
- Body text: 16-18px for optimal readability
- Font weights: Regular (400) for body, Semibold (600) for subheadings, Bold (700-800) for headers
- Line height: 1.6 for body text, 1.2 for headings
- Maximum text width: 65-70 characters (max-w-prose) for long-form content

**Layout & Spacing System**
- Tailwind spacing units: 4, 6, 8, 12, 16, 24 (p-4, p-6, p-8, etc.)
- Section padding: py-16 to py-24 on desktop, py-12 on mobile
- Component spacing: mb-8 for major elements, mb-4 for related items
- Generous whitespace: Let content breathe with ample margins and padding
- Container: max-w-7xl for full layouts, max-w-4xl for content-focused pages

**Visual Style**
- Background: Pure white (#FFFFFF) for all pages
- Text: Rich black (#0A0A0A) for primary content, gray-600 for secondary
- Accent: Vibrant orange (#FF6B35 or similar) - used sparingly for CTAs, active states, and key highlights
- Soft curves: rounded-xl (12px) for cards, rounded-lg (8px) for buttons, rounded-2xl (16px) for modals
- Subtle shadows: Use shadow-sm for cards, shadow-md for elevated elements, shadow-lg for modals

## Page-Specific Designs

### Login Page
- Centered layout with max-w-md container
- Large hero typography: "Welcome to Notes Edu Mamae" (text-5xl font-bold)
- Subheading explaining the app briefly (text-lg text-gray-600)
- Google Sign-in button: White with subtle border, Google icon, orange hover state
- Background: Subtle geometric pattern or soft gradient overlay (optional)
- Image: Abstract illustration of collaborative note-taking (positioned beside login form on desktop, above on mobile)

### Dashboard
- Two-column header: Logo/app name on left, user profile + logout on right
- Pinned notes section: Highlighted with subtle orange border-left accent
- Grid layout: 3 columns on desktop (grid-cols-3), 2 on tablet, 1 on mobile
- Note cards: White with shadow-sm, rounded-xl, hover:shadow-md transition
- Each card shows: Title (font-semibold), preview text (2-3 lines, text-gray-600), timestamp, pin icon
- Floating "Create Note" button: Fixed bottom-right, orange background, rounded-full, shadow-lg
- Empty state: Large icon, encouraging message, create button

### Editor Page
- Clean, distraction-free interface
- Top toolbar: Title input (text-3xl font-bold, borderless), back button, share button (orange), export dropdown
- Main content area: Full-width textarea with minimal styling, auto-focus
- Auto-save indicator: Small text in corner "Saving..." / "Saved" with subtle animation
- Collaborators section: Avatar pills with names along the top or in a sidebar
- Share modal: Clean overlay with rounded-2xl, options for viewer/editor, email input, copy link button (orange)
- Export dropdown: Positioned below export button, white card with shadow-lg

### Shared View Page
- Similar to editor but with read-only indicator banner at top (subtle orange background)
- Banner text: "You're viewing this note as [Viewer/Editor]"
- If viewer: Content is non-editable with subtle visual cue
- If editor: Full editing capabilities enabled

## Component Library

**Buttons**
- Primary (orange): bg-orange-500, text-white, px-6 py-3, rounded-lg, font-semibold, hover:bg-orange-600
- Secondary: border-2 border-gray-300, text-gray-700, px-6 py-3, rounded-lg, hover:border-gray-400
- Icon buttons: p-2, rounded-lg, hover:bg-gray-100

**Cards**
- Note card: bg-white, rounded-xl, p-6, shadow-sm, border border-gray-100
- Hover state: shadow-md, subtle scale transform

**Inputs**
- Title input: Borderless, text-3xl, font-bold, focus:outline-none, placeholder in gray-400
- Content textarea: Borderless, text-lg, min-h-screen, focus:outline-none
- Email input: border-2 border-gray-300, rounded-lg, px-4 py-2, focus:border-orange-500

**Modals**
- Overlay: bg-black/50 backdrop blur
- Modal: bg-white, rounded-2xl, shadow-2xl, max-w-lg, p-8
- Close button: Top-right, gray icon, hover:bg-gray-100

**Navigation**
- Simple header bar: py-4, border-b border-gray-200
- Logo text: text-2xl font-bold with subtle orange accent on first letter
- User profile: Avatar (rounded-full), name, dropdown menu

## Images

**Login Page Image**
- Abstract illustration showing multiple people collaborating on floating note cards
- Style: Minimal line art with orange accent highlights
- Placement: Right side of login form on desktop (50/50 split), full-width above form on mobile
- Size: Square aspect ratio, approximately 400-500px

**Dashboard Empty State**
- Large icon: Note/document illustration in gray with orange accent
- Size: 120-150px, centered above text

**Hero Typography Treatment**
- No traditional hero image needed
- Focus on large-scale typography with generous whitespace
- Optional: Subtle background texture or soft geometric shapes in light gray

## Animations
- Minimal and purposeful only
- Auto-save indicator: Gentle fade in/out
- Card hover: Smooth shadow transition (200ms)
- Modal: Fade in overlay + scale up modal (300ms)
- Button interactions: Subtle color transitions (150ms)

## Accessibility
- Maintain minimum 4.5:1 contrast ratio for all text
- Focus states: Orange outline (ring-2 ring-orange-500) for keyboard navigation
- Semantic HTML throughout
- ARIA labels for icon-only buttons
- Sufficient touch targets (minimum 44x44px)