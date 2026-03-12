# 🎨 VayaZed Bus Booking - Visual Showcase

## Color Palette - Zambian Flag Theme

### Primary Colors

#### 🟢 Zambian Green (#198A00)
**Represents:** Natural resources and agriculture
**Used for:**
- Primary buttons
- Navigation highlights
- Success messages
- Company badges
- Main CTAs

**Shades Available:**
- 50: #E8F5E6 (Lightest)
- 100: #C8E6C4
- 200: #A5D69F
- 300: #82C67A
- 400: #67B95E
- 500: #198A00 (Base)
- 600: #157A00
- 700: #116600
- 800: #0D5200
- 900: #083E00 (Darkest)

---

#### 🟠 Zambian Orange (#EF7D00)
**Represents:** Mineral wealth (copper)
**Used for:**
- Secondary buttons
- Accent elements
- Price displays
- Bus type badges
- Highlights

**Shades Available:**
- 50: #FFF3E6 (Lightest)
- 100: #FFE0BF
- 200: #FFCC95
- 300: #FFB86B
- 400: #FFA84B
- 500: #EF7D00 (Base)
- 600: #D66F00
- 700: #BD6200
- 800: #A45500
- 900: #8B4800 (Darkest)

---

#### 🔴 Zambian Red (#DE2010)
**Represents:** Struggle for freedom
**Used for:**
- Error messages
- Alerts
- Important notices
- Urgent actions
- Warnings

**Shades Available:**
- 50: #FEE9E7 (Lightest)
- 100: #FCC8C3
- 200: #FAA49B
- 300: #F88073
- 400: #F66455
- 500: #DE2010 (Base)
- 600: #C81D0E
- 700: #B81808
- 800: #A01406
- 900: #880F04 (Darkest)

---

#### ⚫ Zambian Black (#000000)
**Represents:** The Zambian people
**Used for:**
- Text content
- Footer backgrounds
- Contrast elements
- Borders
- Icons

---

## UI Components

### Buttons

#### Primary Button (Green)
```
Background: Gradient from Zambian Green 500 to 600
Text: White
Hover: Gradient from 600 to 700
Shadow: Large
Transform: Scale up on hover
```

#### Secondary Button (Orange)
```
Background: Gradient from Zambian Orange 500 to 600
Text: White
Hover: Gradient from 600 to 700
Shadow: Large
Transform: Scale up on hover
```

#### Outline Button
```
Border: 2px Zambian Green 500
Text: Zambian Green 600
Hover: Background Zambian Green 50
```

---

### Cards

#### Bus Result Card
```
Background: White
Border Left: 4px Zambian Green 500
Shadow: Large
Hover: Shadow XL + Lift effect
Padding: 6 (1.5rem)
Border Radius: XL (0.75rem)
```

#### Feature Card
```
Background: White
Border Top: 4px (alternating Green/Orange)
Shadow: Large
Hover: Shadow XL
Padding: 6 (1.5rem)
Border Radius: XL (0.75rem)
Text Align: Center
```

---

### Badges

#### Company Badge
```
Background: Zambian Green 100
Text: Zambian Green 700
Padding: X: 4, Y: 2
Border Radius: LG (0.5rem)
Font Weight: Bold
```

#### Bus Type Badge
```
Background: Zambian Orange 100
Text: Zambian Orange 700
Padding: X: 3, Y: 1
Border Radius: Full (9999px)
Font Weight: Semibold
Font Size: SM (0.875rem)
```

#### Seat Availability Badges
```
🟢 Many Seats (>10 available):
   Background: Emerald 100 (#D1FAE5)
   Text: Emerald 700 (#059669)
   Border: 2px Emerald 300
   Dot: Emerald 600

🟡 Limited Seats (5-10 available):
   Background: Amber 100 (#FEF3C7)
   Text: Amber 700 (#D97706)
   Border: 2px Amber 300
   Dot: Amber 600

🔴 Almost Full (<5 available):
   Background: Red 100 (#FEE2E2)
   Text: Red 700 (#DC2626)
   Border: 2px Red 300
   Dot: Red 600

⚫ Sold Out (0 available):
   Background: Gray 100 (#F3F4F6)
   Text: Gray 500 (#9CA3AF)
   Border: 2px Gray 300
   Dot: Gray 400
```

#### Feature Badges
```
💰 Lowest Price:
   Background: Zambian Orange (#EF7D00)
   Text: White
   Border Radius: Full (9999px)
   Icon: 💰

🎫 Most Seats:
   Background: Zambian Green (#198A00)
   Text: White
   Border Radius: Full (9999px)
   Icon: 🎫

⭐ VIP Coach:
   Background: Purple 600 (#7C3AED)
   Text: White
   Border Radius: Full (9999px)
   Icon: ⭐

⚡ Express Service:
   Background: Cyan 600 (#0891B2)
   Text: White
   Border Radius: Full (9999px)
   Icon: ⚡
```

#### Amenity Filter Chips
```
Inactive:
   Background: White
   Border: 1px Gray 300
   Text: Gray 600
   
Active:
   Background: Zambian Green 50 (#E8F5E6)
   Border: 2px Zambian Green (#198A00)
   Text: Zambian Green 600
   Checkmark: ✓
```

---

### Forms

#### Input Fields
```
Border: 2px Gray 300
Border Radius: LG (0.5rem)
Padding: X: 4, Y: 3
Focus Border: Zambian Green 500
Focus Ring: 2px Zambian Green 200
Transition: All
```

#### Select Dropdowns
```
Same as Input Fields
Cursor: Pointer
Background: White
```

---

## Layout Sections

### Header
```
Background: White
Shadow: MD
Border Bottom: 4px Zambian Green 500
Padding: Y: 4 (1rem)
Position: Sticky
Top: 0
Z-Index: 1000
Behavior: Always visible while scrolling
```

### Hero Section
```
Background: Gradient from Zambian Green 50 via White to Orange 50
Padding: Y: 12 (3rem)
Text Align: Center
```

### Search Form
```
Background: White
Border Radius: 2XL (1rem)
Shadow: 2XL
Border Top: 4px Zambian Green 500
Padding: 8 (2rem)
Max Width: 5XL (64rem)
Margin: Auto
```

### Date Carousel (Flexible Search)
```
Container:
   Display: Flex
   Gap: 0.5rem
   Overflow-X: Auto
   Justify: Center
   Flex-Wrap: Wrap

Date Card (Inactive):
   Min Width: 100px
   Padding: 0.75rem 1rem
   Background: White
   Border: 2px Gray 300
   Border Radius: 0.75rem
   
Date Card (Active/Selected):
   Background: Gradient Zambian Green 500 to 700
   Border: 2px Zambian Green 500
   Text: White
   
Date Card Content:
   Day Name: Font 0.75rem, Opacity 0.8
   Day Number: Font 1rem, Bold
   Month: Font 0.7rem, Opacity 0.8
   Bus Count: Font 0.7rem, Colored (Green if selected, else Green 600)
   Price: Font 0.7rem, "from K{price}"

Today Badge:
   Position: Absolute Top -8px
   Background: Zambian Orange (#EF7D00)
   Text: White
   Font Size: 0.65rem
   Padding: 2px 6px
   Border Radius: 4px
```

### Flexible Date Toggle
```
Container:
   Display: Flex
   Align: Center
   Gap: 0.75rem
   Padding: 0.75rem 1rem
   Border Radius: 0.5rem
   
Inactive:
   Background: Gray 100 (#F5F5F5)
   Border: 2px Transparent
   
Active:
   Background: Zambian Green 50 (#E8F5E6)
   Border: 2px Zambian Green 500
   
Checkbox:
   Width/Height: 1.25rem
   Accent Color: Zambian Green (#198A00)
```

### Footer
```
Background: Gradient from Green 700 via Green 800 to Black
Text: White
Padding: Y: 12 (3rem)
Margin Top: 16 (4rem)
```

---

## Typography

### Headings

#### H1 (Page Title)
```
Font Size: 5XL (3rem)
Font Weight: Bold (700)
Line Height: 1.2
Color: Gray 800
```

#### H2 (Section Title)
```
Font Size: 2XL (1.5rem)
Font Weight: Bold (700)
Margin Bottom: 4 (1rem)
Color: Gray 800
```

#### H3 (Card Title)
```
Font Size: LG (1.125rem)
Font Weight: Bold (700)
Margin Bottom: 2 (0.5rem)
Color: Gray 800
```

### Body Text
```
Font Size: Base (1rem)
Line Height: 1.6
Color: Gray 600
```

### Small Text
```
Font Size: SM (0.875rem)
Color: Gray 500
```

---

## Gradients

### Primary Gradient (Green to Orange)
```css
background: linear-gradient(to right, #198A00, #EF7D00);
```

### Button Gradient (Green)
```css
background: linear-gradient(to right, #198A00, #157A00);
hover: linear-gradient(to right, #157A00, #116600);
```

### Button Gradient (Orange)
```css
background: linear-gradient(to right, #EF7D00, #D66F00);
hover: linear-gradient(to right, #D66F00, #BD6200);
```

### Footer Gradient
```css
background: linear-gradient(to right, #116600, #0D5200, #000000);
```

---

## Spacing System

### Padding Scale
- 1: 0.25rem (4px)
- 2: 0.5rem (8px)
- 3: 0.75rem (12px)
- 4: 1rem (16px)
- 5: 1.25rem (20px)
- 6: 1.5rem (24px)
- 8: 2rem (32px)
- 10: 2.5rem (40px)
- 12: 3rem (48px)

### Margin Scale
Same as padding scale

---

## Shadows

### Small
```
box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
```

### Medium
```
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
```

### Large
```
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
```

### XL
```
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

### 2XL
```
box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

---

## Border Radius

### SM: 0.125rem (2px)
### Base: 0.25rem (4px)
### MD: 0.375rem (6px)
### LG: 0.5rem (8px)
### XL: 0.75rem (12px)
### 2XL: 1rem (16px)
### Full: 9999px (Pill shape)

---

## Animations

### Transitions
```
Duration: 150ms
Timing: cubic-bezier(0.4, 0, 0.2, 1)
Properties: all
```

### Hover Effects
```
Transform: translateY(-2px) or scale(1.05)
Shadow: Increase by one level
```

### Loading Spinner
```
Animation: spin 1s linear infinite
Border: 3px solid rgba(25, 138, 0, 0.1)
Border Top: Zambian Green
```

---

## Image Components

### Company Logo
```
Container:
   Width: 40px
   Height: 40px
   Border Radius: Full (9999px)
   Overflow: Hidden
   Background: Gray 100 (fallback)
   Border: 2px White
   Shadow: SM
   
Image:
   Object Fit: Cover
   Width: 100%
   Height: 100%

Fallback (No Logo):
   Display: Flex
   Align: Center
   Justify: Center
   Background: Gray 200
   Icon: 🚌 (1.25rem)
```

### Bus Preview Image
```
Container:
   Width: 80px
   Height: 60px
   Border Radius: LG (0.5rem)
   Overflow: Hidden
   Cursor: Pointer
   Position: Relative
   Flex Shrink: 0
   
Image:
   Object Fit: Cover
   Width: 100%
   Height: 100%
   Transition: Transform 200ms
   Hover: Scale(1.05)

Extra Images Badge:
   Position: Absolute Bottom Right 4px
   Background: Black/70 (rgba(0,0,0,0.7))
   Color: White
   Font Size: XS (0.65rem)
   Padding: 2px 4px
   Border Radius: SM (4px)
   Font Weight: Medium
   Format: "+{count}"

No Image Fallback:
   Background: Gray 100
   Display: Flex
   Align: Center
   Justify: Center
   Icon: 🚌 (Gray 400, 1.5rem)
```

### Image Lightbox Gallery
```
Overlay:
   Position: Fixed
   Inset: 0
   Background: Black/95 (rgba(0,0,0,0.95))
   Z-Index: 60
   Display: Flex
   Flex Direction: Column
   
Header:
   Display: Flex
   Justify: Space Between
   Align: Center
   Padding: 1rem 1.5rem
   Color: White
   
   Title:
      Font Size: LG (1.125rem)
      Font Weight: Bold
      
   Counter:
      Color: Gray 400
      Format: "{current} / {total}"
      
   Close Button:
      Width: 40px
      Height: 40px
      Border Radius: Full
      Background: White/10 (hover: White/20)
      Color: Gray 300 (hover: White)

Main Image Area:
   Flex: 1
   Display: Flex
   Align: Center
   Justify: Center
   Padding: 1rem
   Position: Relative
   
   Image:
      Max Width: 90%
      Max Height: 70vh
      Object Fit: Contain
      Border Radius: LG
      Shadow: 2XL
      
Navigation Arrows:
   Position: Absolute
   Top: 50%
   Transform: TranslateY(-50%)
   Width: 48px
   Height: 48px
   Border Radius: Full
   Background: White/20 (hover: White/30)
   Color: White
   Font Size: 1.5rem
   
   Left Arrow: Left 1rem
   Right Arrow: Right 1rem
   
Thumbnail Strip:
   Display: Flex
   Gap: 0.5rem
   Justify: Center
   Padding: 1rem
   Background: Black/50
   Overflow-X: Auto
   
   Thumbnail:
      Width: 64px
      Height: 48px
      Border Radius: MD (0.375rem)
      Overflow: Hidden
      Cursor: Pointer
      Opacity: 0.6 (hover/active: 1)
      Border: 2px Transparent (active: White)
      Transition: All 150ms
```

---

## Responsive Breakpoints

### Mobile
```
< 640px
- Single column layouts
- Stacked forms
- Full-width buttons
- Larger touch targets
```

### Tablet
```
640px - 1024px
- 2-column layouts
- Grid systems
- Balanced spacing
```

### Desktop
```
> 1024px
- 3-4 column layouts
- Maximum width containers
- Optimal reading width
- Generous spacing
```

---

## Icons & Emojis

### Used Throughout
- 🚌 Bus
- 🇿🇲 Zambian Flag
- 📍 Location Pin
- 🎯 Target
- 📅 Calendar
- 🕐 Clock
- 💺 Seat
- ❄️ AC
- 📶 WiFi
- 🔌 Charging
- 📺 Entertainment
- 💳 Payment
- 📱 Mobile
- 📷 Camera/Photos
- 🖼️ Image/Gallery
- ✓ Checkmark
- ✕ Close
- ← → Arrows
- + Plus (image count badge)

---

## Accessibility

### Focus States
```
Outline: None
Ring: 2px Zambian Green 500
Ring Offset: 2px
```

### Color Contrast
- All text meets WCAG AA standards
- Minimum contrast ratio: 4.5:1
- Large text: 3:1

### Screen Reader Support
- Semantic HTML
- ARIA labels where needed
- Alt text for images
- Skip links available

---

## Print Styles

### Hidden Elements
- Navigation
- Buttons
- Interactive elements

### Optimized
- Black text on white
- Simplified layouts
- Page breaks respected

---

**This visual system creates a cohesive, professional, and distinctly Zambian brand identity! 🇿🇲**