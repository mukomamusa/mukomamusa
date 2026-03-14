#!/bin/bash

# Script to update all old color references to Vayazed v2.0.0 teal colors

echo "Starting color update for Vayazed v2.0.0..."

# Color mappings:
# #198A00 (Zambian Green) -> #2BB2A9 (Vayazed Teal)
# #157A00 -> #259E96
# #116600 -> #1F8A83
# #0D5200 -> #197670
# #083E00 -> #13625D
# #E8F5E6 -> #E6F7F6
# #C8E6C4 -> #CCEEEE

# #DE2010 (Zambian Red) -> #2BB2A9 (Vayazed Teal for error states)
# #EF7D00 (Zambian Orange) -> #659E85 (Vayazed Green accent)

echo "Updating color values in TypeScript and JavaScript files..."

# Replace primary green colors with teal
find app -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" \) -exec sed -i 's/#198A00/#2BB2A9/g' {} \;
find app -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" \) -exec sed -i 's/#157A00/#259E96/g' {} \;
find app -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" \) -exec sed -i 's/#116600/#1F8A83/g' {} \;
find app -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" \) -exec sed -i 's/#0D5200/#197670/g' {} \;
find app -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" \) -exec sed -i 's/#083E00/#13625D/g' {} \;

# Replace light green backgrounds
find app -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" \) -exec sed -i 's/#E8F5E6/#E6F7F6/g' {} \;
find app -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" \) -exec sed -i 's/#C8E6C4/#CCEEEE/g' {} \;

# Replace red (error) with dark teal
find app -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" \) -exec sed -i 's/#DE2010/#1A8A82/g' {} \;
find app -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" \) -exec sed -i 's/#C81D0E/#157A74/g' {} \;

# Replace orange with green accent
find app -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" \) -exec sed -i 's/#EF7D00/#659E85/g' {} \;
find app -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" \) -exec sed -i 's/#D66F00/#5A8E76/g' {} \;

# Replace light orange backgrounds with light green
find app -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" \) -exec sed -i 's/#FFF3E6/#E8F3EC/g' {} \;
find app -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" \) -exec sed -i 's/#FFE0BF/#D1E8DA/g' {} \;

# Replace light red backgrounds
find app -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" \) -exec sed -i 's/#FEE9E7/#E6F5F4/g' {} \;
find app -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" \) -exec sed -i 's/#FCC8C3/#CDEBEB/g' {} \;

echo "Color update completed!"
echo "Updated files:"
find app -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" \) | wc -l

echo "Verifying changes..."
echo "Sample of updated colors:"
grep -r "#2BB2A9" app --include="*.tsx" --include="*.jsx" | head -3

echo "Done! 🎨"