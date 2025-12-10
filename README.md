# Quarto Infinite Scroll with Language Switching

A complete implementation of infinite scrolling and multi-language support for Quarto websites which has been used for https://nafiszaki.com/ (my personal site). This project provides two JavaScript scripts that work together to create a seamless reading experience across multiple articles and languages.

## Features

### Infinite Scroll Script
- **IntersectionObserver-based loading**: Automatically loads the next article when the user scrolls near the bottom
- **Smart URL updating**: Updates the browser URL as users scroll through articles without page jumps
- **Dynamic Table of Contents**: Automatically swaps TOC content as users navigate between articles
- **Manual scroll restoration**: Prevents unwanted scroll jumps when updating URLs
- **Plotly support**: Re-executes scripts to ensure interactive visualizations render correctly
- **Image optimization**: Implements lazy loading with fade-in effects for better performance
- **Prefetching**: Preloads the next article for smoother transitions
- **Multi-language support**: Works seamlessly with language-specific article versions

### Language Switcher Script
- **Automatic language detection**: Detects the current page language from URL patterns
- **Dynamic link updates**: Updates language switcher links based on available translations
- **Search index integration**: Uses Quarto's search.json to verify translation availability
- **Infinite scroll integration**: Responds to article changes and updates language links accordingly

## Installation

1. Copy both scripts to your Quarto project directory
2. Include them in your Quarto website configuration

### In your `_quarto.yml`:

```yaml
format:
  html:
    include-after-body:
      - infinite-scroll.js
      - language-switcher.js
```

### Or include them directly in your HTML template:

```html
<script src="infinite-scroll.js"></script>
<script src="language-switcher.js"></script>
```

## Configuration

### Article Order

Define your article loading order in the infinite scroll script. Edit the `articleOrder` array:

```javascript
const articleOrder = ["index", "ExchangeRate", "LearningPython", "STMP", "AI", "GME"];
```

### Excluded Pages

Specify pages that should not use infinite scrolling:

```javascript
const excludedPages = ["about", "more"];
```

### Language Support

The scripts support three languages by default:
- **English**: No suffix (e.g., `index.html`)
- **Bengali**: `_bn` suffix (e.g., `index_bn.html`)
- **Urdu**: `_ur` suffix (e.g., `index_ur.html`)

To add more languages, modify both scripts to recognize new suffixes.

## File Naming Convention

Your Quarto files should follow this naming pattern:
- English: `article-name.qmd` (renders to `article-name.html`)
- Bengali: `article-name_bn.qmd` (renders to `article-name_bn.html`)
- Urdu: `article-name_ur.qmd` (renders to `article-name_ur.html`)

## How It Works

### Infinite Scroll Mechanism

1. **Initial Page Load**: The script wraps the current article content in a container
2. **Sentinel Observer**: Places an invisible sentinel element at the bottom of the page
3. **Intersection Detection**: When the sentinel enters the viewport, the next article loads
4. **Content Processing**: Fetches, parses, and appends the next article
5. **URL Updating**: Updates the browser URL when articles become "active" (cross viewport center)
6. **TOC Swapping**: Replaces the Table of Contents with the active article's TOC
7. **Script Re-execution**: Ensures interactive elements like Plotly charts work correctly

### Language Switching Mechanism

1. **Detection**: Identifies the current page's language from the URL
2. **Index Verification**: Checks `search.json` to find available translations
3. **Link Updates**: Updates language switcher dropdown with correct links
4. **Visibility Control**: Shows only available language options
5. **Event Listening**: Responds to infinite scroll article changes

## CSS Requirements

Add these styles to your Quarto theme for optimal appearance:

```css
.infinite-article {
  opacity: 0;
  transition: opacity 0.3s ease-in;
}

.infinite-article.visible {
  opacity: 1;
}

.fade-in-image {
  opacity: 0;
  transition: opacity 0.3s ease-in;
}

.fade-in-image.visible {
  opacity: 1;
}

#infinite-scroll-loading {
  display: none;
  text-align: center;
  padding: 2rem;
}

#infinite-scroll-loading.visible {
  display: block;
}

.spinner {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid #fff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

## Language Switcher Setup

Add a language dropdown to your Quarto navigation:

```yaml
website:
  navbar:
    right:
      - text: "Language"
        menu:
          - text: "English"
            href: "#"
          - text: "বাংলা (Bengali)"
            href: "#"
          - text: "اردو (Urdu)"
            href: "#"
```

## Browser Support

- Modern browsers with IntersectionObserver support (Chrome 51+, Firefox 55+, Safari 12.1+, Edge 15+)
- Requires JavaScript enabled
- Works best with `history.scrollRestoration` support

## Performance Considerations

- **Prefetching**: Articles are prefetched before needed
- **Lazy Loading**: Images load only when approaching the viewport
- **Script Optimization**: Scripts execute only when their container loads
- **Memory Management**: Consider implementing unloading for very long article chains

## Troubleshooting

### Articles not loading
- Check the `articleOrder` array matches your actual file names
- Verify files are accessible at the expected URLs
- Check browser console for fetch errors

### Language switcher not appearing
- Ensure `search.json` is generated by Quarto
- Verify translation files exist with correct naming
- Check that language dropdown is in your navbar

### Plotly charts not rendering
- Ensure Plotly script is included in your Quarto setup
- Check that `executeScripts` function runs successfully
- Verify no JavaScript errors in console

### URL not updating
- Confirm `history.scrollRestoration = 'manual'` is set
- Check that articles have correct `data-index` attributes
- Verify no conflicts with other URL manipulation scripts

## Limitations

- Works only with predefined article order (not dynamic content)
- Requires manual configuration of article sequence
- Language switcher depends on Quarto's search.json
- Not suitable for websites with complex routing

## Contributing

Feel free to fork this repository and submit pull requests. Suggestions for improvements are welcome.

## License

This project is open source and available for anyone to use and modify.

## Credits

Created for Quarto websites that need seamless multi-article navigation with language support.

## Future Enhancements

Potential improvements for future versions:
- Automatic article order detection
- Infinite scroll in both directions (up and down)
- More sophisticated memory management
- Additional language support
- Custom loading animations
- Article unloading after threshold
