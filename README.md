# Calculator Romanus

A working calculator that uses **only Roman numerals**, both on the display and on the buttons. Plain HTML, CSS and JS, with no build step. The CSS is inlined in `index.html` so the layout can never load without its styles.

**Live:** https://johnesco.github.io/roman-calculator/

## Keys

| Key | Meaning |
|---|---|
| `M D C L X V I` | 1000, 500, 100, 50, 10, 5, 1 |
| `S` | *semis*, ½ |
| `·` | *uncia*, 1⁄12 (up to five after `S`) |
| `N` | *nulla*, zero |
| `+ − × ÷` | operators (evaluated left to right) |
| `=` | equals |
| `⌫` / `↺` | delete last / clear all |

The keyboard works too: `m d c l x v i s n . + - * / Enter Backspace Esc`.

## Rules

- Input is limited to standard (subtractive) numerals, so you can't type `IIII` or `VX`.
- Fractions are shown in Roman twelfths (`S` and `·`) and rounded to the nearest uncia. Example: `X ÷ III = III····`.
- Results from 4,000 up to 3,999,999 put a bar (vinculum) over the thousands, e.g. <ins>IV</ins> = 4000.
- Negative results get a `−` prefix. Dividing by zero, or a result too large to show, displays `∞`.
