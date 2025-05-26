# Contributing to React Native Pulse Debugger

Thank you for your interest in contributing to Pulse! This document provides guidelines and instructions for contributing to the project.

## Project Structure

The project is organized into three main packages:

- `@react-native-pulse-debugger/lib`: The core library for React Native applications
- `@react-native-pulse-debugger/tool`: The desktop debugger application
- `@react-native-pulse-debugger/types`: Shared TypeScript types and interfaces

## Development Setup

1. Clone the repository
2. Install dependencies:

   ```bash
   yarn install
   ```

3. Start the development server for the desktop tool:

   ```bash
   cd packages/tool
   yarn dev
   ```

4. For library development:
   ```bash
   cd packages/lib
   yarn prepare
   ```

## Code Style

- We use TypeScript for type safety
- Follow the existing code style and formatting
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and small
- Write tests for new features

## Development Workflow

1. Create a new branch for your feature/fix:

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-fix-name
   ```

2. Make your changes and commit them:

   ```bash
   git add .
   git commit -m "feat: your feature description"
   # or
   git commit -m "fix: your fix description"
   ```

3. Push your changes:

   ```bash
   git push origin feature/your-feature-name
   ```

4. Create a Pull Request (PR) from your branch to the main branch

## Pull Request Guidelines

- Provide a clear description of your changes
- Include screenshots or GIFs for UI changes
- Reference any related issues
- Ensure all tests pass
- Update documentation if needed
- If your changes affect multiple packages, test all affected packages

## Testing

- Write unit tests for new features
- Ensure existing tests pass
- Test your changes on both iOS and Android
- Test with different React Native versions
- Test the debugger tool on all supported platforms (macOS, Windows, Linux)

## Documentation

- Update README.md if needed
- Add JSDoc comments for new functions
- Update API documentation
- Include examples for new features
- Document any changes to the shared types

## Bug Reports

When filing a bug report, please include:

- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (OS, React Native version, etc.)
- Screenshots or videos if applicable
- Which package(s) are affected (lib, tool, or both)

## Feature Requests

When suggesting new features:

- Explain the problem you're trying to solve
- Describe your proposed solution
- Include any relevant examples
- Consider edge cases and potential impacts
- Specify which package(s) would be affected

## Versioning and Releases

We use Changesets for version management. When making changes that require a version bump:

1. Create a changeset:

   ```bash
   yarn changeset
   ```

2. Select the affected packages and version bump type:

   - `patch`: For backwards-compatible bug fixes
   - `minor`: For new backwards-compatible features
   - `major`: For breaking changes

3. Write a description of your changes

4. Commit the changeset:
   ```bash
   git add .changeset
   git commit -m "chore: add changeset"
   ```

The CI will automatically create a version PR when changesets are present.

## Package Dependencies

- `lib` and `tool` both depend on `types`
- When modifying `types`, ensure changes are compatible with both packages
- Test changes in both packages before submitting a PR

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

## Getting Help

- Open an issue for bugs or feature requests
- Join our community discussions
- Check existing documentation
- Ask questions in issues or discussions

## Common Issues and Solutions

### Building Issues

- Ensure you have the correct Node.js version installed
- Clear yarn cache if you encounter dependency issues: `yarn cache clean`
- Rebuild all packages: `yarn build`

### Testing Issues

- Run tests for specific package: `cd packages/package-name && yarn test`
- Run tests with coverage: `yarn test --coverage`

### Development Environment

- Use VS Code with recommended extensions
- Enable TypeScript strict mode
- Use the provided ESLint and Prettier configurations

Thank you for contributing to Pulse! Your help makes this project better for everyone.
