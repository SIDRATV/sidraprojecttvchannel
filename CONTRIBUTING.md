# Contributing Guide

## Code of Conduct

- Be respectful and inclusive
- Focus on code quality
- Help others learn
- Report issues constructively

## How to Contribute

### 1. Fork & Clone

```bash
git clone https://github.com/yourusername/sidra-project-tv-channel.git
cd sidra-project-tv-channel
```

### 2. Create Feature Branch

```bash
git checkout -b feature/amazing-feature
```

### 3. Make Changes

- Follow existing code style
- Add comments for complex logic
- Update tests as needed

### 4. Commit & Push

```bash
git add .
git commit -m "feat: add amazing feature"
git push origin feature/amazing-feature
```

### 5. Create Pull Request

- Describe your changes clearly
- Reference any related issues
- Include screenshots for UI changes

## Code Style

### TypeScript
- Use strict mode
- Define interfaces for all objects
- Avoid `any` type

### React Components
- Use functional components with hooks
- Memoize expensive computations
- Use proper TypeScript typing

### Naming Conventions
- Components: PascalCase (`VideoCard.tsx`)
- Functions/Hooks: camelCase (`useAuth.ts`)
- Constants: UPPER_SNAKE_CASE
- Files: kebab-case for utilities

### Formatting
```bash
npm run lint  # Check code style
npm run build # Test build
```

## Testing

```bash
# Manual testing
npm run dev

# Check types
npm run type-check
```

## Documentation

- Update README for new features
- Document API changes in docs/
- Add JSDoc comments for functions
- Include examples where helpful

## Areas for Contribution

### High Priority
- [ ] Improve video player UI
- [ ] Add playlist functionality
- [ ] Implement recommendation algorithm
- [ ] Add social sharing features

### Medium Priority
- [ ] Advanced search filters
- [ ] Watch history tracking
- [ ] Video download option
- [ ] Subtitle support

### Low Priority
- [ ] Additional theme options
- [ ] More icon sets
- [ ] Language localization
- [ ] Mobile app (React Native)

## Questions?

- Open an issue on GitHub
- Check existing discussions
- Join our Discord community

## Licensing

By contributing, you agree your changes are released under the MIT license.

Thank you for helping make Sidra Project TV Channel amazing! 🚀
