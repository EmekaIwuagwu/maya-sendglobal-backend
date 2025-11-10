# Contributing to Maya Global Pay Backend

Thank you for your interest in contributing to Maya Global Pay! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and collaborative environment for everyone.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- PostgreSQL 15+
- Redis 7+
- Git

### Setup Development Environment

1. **Fork the repository**
```bash
git clone https://github.com/yourusername/maya-sendglobal-backend.git
cd maya-sendglobal-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment**
```bash
cp .env.example .env
# Edit .env with your local configuration
```

4. **Start services**
```bash
docker-compose up -d
```

5. **Run migrations**
```bash
npm run prisma:migrate
npm run prisma:seed
```

6. **Start development server**
```bash
npm run dev
```

## Development Workflow

### Creating a New Feature

1. **Create a feature branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes**
   - Write clean, documented code
   - Follow the established patterns
   - Add tests for new functionality

3. **Test your changes**
```bash
npm run lint
npm run type-check
npm test
```

4. **Commit your changes**
```bash
git add .
git commit -m "feat: description of your feature"
```

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

5. **Push to your fork**
```bash
git push origin feature/your-feature-name
```

6. **Create a Pull Request**

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Define proper types for all functions and variables
- Avoid `any` type when possible

### Code Style

- Follow the existing code style
- Use ESLint and Prettier (configured in the project)
- Run `npm run lint:fix` before committing
- Use meaningful variable and function names
- Write self-documenting code with comments where necessary

### Example Service

```typescript
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { AppError } from '../utils/error-codes';

export class ExampleService {
  /**
   * Get example by ID
   */
  static async getById(id: string) {
    try {
      const example = await prisma.example.findUnique({
        where: { id },
      });

      if (!example) {
        throw new AppError('EXAMPLE_001', 404);
      }

      return example;
    } catch (error) {
      logger.error('Error getting example:', error);
      throw error;
    }
  }
}
```

### Database Changes

- Create Prisma migrations for schema changes
- Name migrations descriptively
- Never modify existing migrations
- Test migrations on local database first

```bash
npm run prisma:migrate
```

### API Endpoints

- Follow RESTful conventions
- Use proper HTTP status codes
- Return consistent response format
- Add Swagger documentation comments
- Implement proper validation
- Add rate limiting for sensitive endpoints

### Example Controller

```typescript
import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { asyncHandler } from '../middleware/error-handler';
import { AppError } from '../utils/error-codes';

export class ExampleController {
  /**
   * @swagger
   * /api/v1/example:
   *   get:
   *     tags: [Example]
   *     summary: Get example
   *     responses:
   *       200:
   *         description: Success
   */
  static getExample = asyncHandler(
    async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      if (!req.user) {
        throw new AppError('AUTH_003', 401);
      }

      const data = { message: 'Example response' };

      res.json({
        success: true,
        data,
      });
    }
  );
}
```

## Testing

### Writing Tests

- Write unit tests for services
- Write integration tests for API endpoints
- Aim for >80% code coverage
- Use descriptive test names

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Example Test

```typescript
describe('ExampleService', () => {
  describe('getById', () => {
    it('should return example by id', async () => {
      const example = await createTestExample();

      const result = await ExampleService.getById(example.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(example.id);
    });

    it('should throw error if not found', async () => {
      await expect(
        ExampleService.getById('non-existent-id')
      ).rejects.toThrow();
    });
  });
});
```

## Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new functionality
3. **Ensure all tests pass**
4. **Update CHANGELOG.md** if applicable
5. **Request review** from maintainers
6. **Address review comments**
7. **Squash commits** if requested
8. **Wait for approval** and merge

### PR Title Format

Use conventional commit format:
```
feat: add user profile endpoint
fix: resolve transaction processing bug
docs: update API documentation
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
```

## Project Structure

```
src/
├── app.ts                 # Express app setup
├── server.ts              # Server entry point
├── config/                # Configuration
├── controllers/           # Request handlers
│   ├── user/             # User controllers
│   └── admin/            # Admin controllers
├── services/              # Business logic
├── middleware/            # Express middleware
├── routes/                # API routes
├── validators/            # Input validation
├── utils/                 # Utility functions
├── types/                 # TypeScript types
├── jobs/                  # Background jobs
└── tests/                 # Test files
    ├── unit/             # Unit tests
    └── integration/      # Integration tests
```

## Architecture Patterns

### Services
- Contain business logic
- Handle database operations
- Throw AppError for known errors
- Log important events

### Controllers
- Handle HTTP requests
- Validate input
- Call services
- Return formatted responses

### Middleware
- Authentication
- Validation
- Rate limiting
- Error handling

### Validators
- Use Zod for validation
- Export reusable schemas
- Provide clear error messages

## Questions?

If you have questions or need help:
- Open an issue on GitHub
- Contact the maintainers
- Check existing documentation

Thank you for contributing to Maya Global Pay!
