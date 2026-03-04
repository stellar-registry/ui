# Registry UI

## Styling

Do not use Tailwind. The project uses CSS Modules for all styling.

Components in `app/components/` are based on shadcn/css (https://github.com/BadreddineIbril/shadcn-css). Each component has a `*.tsx` and a `*.module.css` file.

All design tokens (colors, spacing, typography, radii, shadows) are defined as CSS custom properties in `app/app.css`. Dark mode is handled via the `.dark` class on `<html>`.
