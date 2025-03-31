# Contributing to Pulse

Thank you for your interest in contributing to Pulse! This document provides guidelines and instructions for contributing to the project.

## 🎯 Development Setup

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/your-username/react-native-pulse-debugger.git
   cd react-native-pulse-debugger
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Start the development environment:
   ```bash
   # Start the debugger app
   cd packages/debugger
   yarn dev
   ```

## 📝 Code Style

- We use TypeScript for type safety
- Follow the existing code style and formatting
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and small
- Write tests for new features

## 🔄 Development Workflow

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

## 📋 Pull Request Guidelines

- Provide a clear description of your changes
- Include screenshots or GIFs for UI changes
- Reference any related issues
- Ensure all tests pass
- Update documentation if needed

## 🧪 Testing

- Write unit tests for new features
- Ensure existing tests pass
- Test your changes on both iOS and Android
- Test with different React Native versions

## 📚 Documentation

- Update README.md if needed
- Add JSDoc comments for new functions
- Update API documentation
- Include examples for new features

## 🐛 Bug Reports

When filing a bug report, please include:

- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (OS, React Native version, etc.)
- Screenshots or videos if applicable

## 💡 Feature Requests

When suggesting new features:

- Explain the problem you're trying to solve
- Describe your proposed solution
- Include any relevant examples
- Consider edge cases and potential impacts

## 📦 Package Updates

When updating dependencies:

- Update both packages (client and debugger)
- Test thoroughly after updates
- Document breaking changes
- Update version numbers appropriately

## 🤝 Community Guidelines

- Be respectful and inclusive
- Help others when possible
- Follow the project's code of conduct
- Provide constructive feedback

## 📄 License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

## 🎉 Getting Help

- Open an issue for bugs or feature requests
- Join our community discussions
- Check existing documentation
- Ask questions in issues or discussions

Thank you for contributing to Pulse! Your help makes this project better for everyone. 