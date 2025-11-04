# Contributing to Contexta

Thank you for your interest in contributing to Contexta! This document provides guidelines and instructions for setting up your development environment and contributing to the project.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)

## Development Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Chrome browser (for testing)
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jmanhype/contexta.git
   cd contexta
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Load the extension in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the project root directory (`contexta/`)
   - The extension should now appear in your extensions list

### Development Mode

The extension can be loaded directly from the source directory without a build step during development:

1. Make changes to the source files in `src/`
2. Click the refresh icon in `chrome://extensions/` for the Contexta extension
3. Reload any YouTube pages to see your changes

## Project Structure

```
contexta/
├── src/
│   ├── background/
│   │   └── service-worker.js    # Background service worker
│   ├── content/
│   │   └── content-script.js    # YouTube page injection
│   ├── popup/
│   │   ├── popup.html           # Extension popup UI
│   │   ├── popup.css            # Popup styles
│   │   └── popup.js             # Popup logic
│   └── styles/
│       └── content.css          # Styles injected into YouTube
├── icons/
│   ├── icon16.png               # Extension icons
│   ├── icon48.png
│   └── icon128.png
├── manifest.json                # Extension manifest
├── package.json                 # NPM dependencies
└── docs/                        # Documentation
```

## Development Workflow

### Working on a Feature

1. **Create a new branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes:**
   - Follow the coding standards below
   - Add comments for complex logic
   - Update documentation if needed

3. **Test your changes:**
   - Load the extension in Chrome
   - Test on various YouTube videos
   - Check browser console for errors
   - Test edge cases

4. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Add feature: brief description"
   ```

### Debugging Tips

**Background Service Worker:**
- Click "Inspect views: service worker" in `chrome://extensions/`
- Use `console.log()` statements
- Check for errors in the DevTools console

**Content Script:**
- Right-click on a YouTube page → "Inspect"
- Content script logs appear in the page console
- Use breakpoints for step-by-step debugging

**Popup:**
- Right-click the extension icon → "Inspect popup"
- Popup console is separate from page console

## Coding Standards

### JavaScript

- Use **ES6+ features** (const/let, arrow functions, async/await)
- Use **camelCase** for variables and functions
- Use **PascalCase** for classes
- Add **JSDoc comments** for functions:
  ```javascript
  /**
   * Translates text from one language to another
   * @param {string} text - Text to translate
   * @param {string} sourceLang - Source language code
   * @param {string} targetLang - Target language code
   * @returns {Promise<string>} Translated text
   */
  async function translateText(text, sourceLang, targetLang) {
    // Implementation
  }
  ```

### CSS

- Use **kebab-case** for class names
- Prefix all custom classes with `contexta-`
- Use CSS custom properties for theming
- Keep specificity low
- Add comments for complex selectors

### HTML

- Use **semantic HTML5** elements
- Include **alt text** for images
- Use **ARIA labels** for accessibility
- Keep markup clean and well-indented

## Testing

### Manual Testing Checklist

Before submitting a PR, test the following:

- [ ] Extension loads without errors
- [ ] Popup displays correctly and settings save
- [ ] Content script injects on YouTube pages
- [ ] No console errors on fresh page load
- [ ] Works on different types of YouTube videos
- [ ] Settings persist after browser restart
- [ ] Vocabulary saving works correctly
- [ ] Quiz system functions as expected

### Automated Testing (Future)

We plan to add:
- Jest for unit tests
- Puppeteer for end-to-end tests
- ESLint for code quality

## Submitting Changes

### Pull Request Process

1. **Update documentation:**
   - Update README.md if you changed functionality
   - Add comments to your code
   - Update TECHNICAL_STRATEGY.md if you changed architecture

2. **Ensure code quality:**
   - No console errors
   - Code is well-commented
   - Follows coding standards
   - Manual testing checklist completed

3. **Create a pull request:**
   - Push your branch to GitHub
   - Open a PR with a clear title and description
   - Reference any related issues
   - Wait for review

4. **Address review feedback:**
   - Make requested changes
   - Push updates to your branch
   - Respond to comments

### Commit Message Format

Use clear, descriptive commit messages:

```
Add dual subtitle display feature

- Implement subtitle overlay component
- Add CSS styling for dual subtitles
- Connect to YouTube caption API
- Add error handling for missing captions

Fixes #123
```

## Code Review Guidelines

When reviewing PRs, look for:

- **Functionality**: Does it work as expected?
- **Code quality**: Is it clean and maintainable?
- **Performance**: Does it impact page load time?
- **Security**: Are there any security concerns?
- **Privacy**: Does it respect user privacy?
- **Documentation**: Is it well-documented?

## Getting Help

- **Questions?** Open a GitHub Discussion
- **Bug reports?** Open a GitHub Issue
- **Security concerns?** Email (to be added)

## License

By contributing to Contexta, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Contexta! Your efforts help make language learning more accessible to everyone.
