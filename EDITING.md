# Editing Technical Debt

You can edit this site with any text editor, including Notepad or Visual Studio Code.

## Main files

- `index.html` contains all visible text, links, product descriptions, and page sections.
- `style.css` controls colors, spacing, fonts, and layout.
- `app.js` controls the signup popups and confirmation messages.
- `assets/keydence.webp` and `assets/hh-44.webp` are the product pictures used by the page. The original full-size PNG files are kept alongside them.

## Common changes

### Add your name

In `index.html`, find `Your Name` and replace it with your name.

### Add your email

Find `hello@example.com` and replace it with your email address.

### Replace a product picture

Export your real photo as PNG or JPG, put it in the `assets` folder, then either:

1. Name it `keydence.webp` or `hh-44.webp` to replace the current image without changing code.
2. Use a new filename and update the matching `src="assets/..."` line in `index.html`.

### Change product text

Search `index.html` for `Keydence` or `HH-44`. The heading, description, features, and status are all grouped together in each product's `<article>` block.

### Add another product

Copy an entire `<article class="product ..."> ... </article>` block in `index.html`, paste it after HH-44, and change its picture and text.

## Run locally

```powershell
cd C:\Users\cjdan\Documents\Codex\2026-06-12\hiu\outputs\technical-debt
python -m http.server 4174
```

Then open `http://localhost:4174`.

The email forms are demos. They save addresses only in the visitor's browser. A real mailing list will need a service such as Buttondown, Mailchimp, or ConvertKit.
