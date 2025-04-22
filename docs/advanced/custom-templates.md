# Custom Templates

Gitit allows you to create and use your own custom templates, giving you full control over the starting point of your projects. This page explains how to create, use, and share custom templates.

## Understanding Custom Templates

A custom template is any Git repository that you want to use as a starting point for your projects. Custom templates can contain:

- File and directory structures
- Base code
- Configuration files
- Documentation
- Scripts and tooling

## Creating a Custom Template

### Basic Structure

To create a custom template, simply create a Git repository with the files and structure you want in your new projects. Here's a typical workflow:

1. Create a new repository on GitHub, GitLab, or another supported platform
2. Add your template files
3. Organize the directories as you want them to appear in new projects
4. Consider adding a README.md with template usage instructions
5. Commit and push your changes

### Template Variables

You can add template variables to your files that will be processed during project creation:

```
// package.json
{
  "name": "{{ project_name }}",
  "version": "0.1.0",
  "description": "{{ project_description }}",
  "author": "{{ author_name }} <{{ author_email }}>"
}
```

These variables will be replaced when the template is used, either through interactive prompts or command-line options.

### Configuration File

To enhance your template, include a `.gitit-template.json` file in the root of your repository:

```json
{
  "name": "my-custom-template",
  "description": "A custom template for web applications",
  "variables": [
    {
      "name": "project_name",
      "description": "Name of the project",
      "default": "my-project"
    },
    {
      "name": "project_description",
      "description": "Brief description of the project",
      "default": "A project created from my custom template"
    },
    {
      "name": "author_name",
      "description": "Your name",
      "default": ""
    },
    {
      "name": "author_email",
      "description": "Your email address",
      "default": ""
    }
  ],
  "hooks": {
    "post-clone": "npm install"
  }
}
```

This configuration file defines the template's metadata, variables, and lifecycle hooks.

## Using Custom Templates

You can use custom templates just like any other template with Gitit:

```bash
gitit github:username/my-custom-template new-project
```

If your template includes variables, you'll be prompted to provide values during the creation process.

### Local Templates

You can also use local template directories:

```bash
gitit ./path/to/local/template new-project
```

This is useful during template development or for templates not hosted in a Git repository.

## Sharing Custom Templates

To share your custom templates with others:

1. Push your template repository to a Git hosting service
2. Share the template URL with your team or community
3. Consider adding your template to the gitit registry (forthcoming feature)

## Best Practices

### Template Organization

- **Keep it focused**: Templates should serve a specific purpose
- **Use clear naming**: Name files and directories intuitively
- **Include documentation**: Add a README.md with usage instructions
- **Provide examples**: Include examples to show how the template should be used

### Template Variables

- **Use meaningful names**: Make variable names descriptive
- **Provide defaults**: Set sensible default values for variables
- **Add descriptions**: Explain what each variable is for
- **Be consistent**: Use the same variable naming pattern throughout

### Maintenance

- **Version your templates**: Use tags for different versions
- **Keep templates updated**: Regularly update dependencies and patterns
- **Collect feedback**: Get input from users of your templates
- **Document changes**: Keep a changelog

## Template Registry (Coming Soon)

In a future update, Gitit will include a template registry where you can publish and discover templates. The registry will allow:

- Template discovery and search
- Ratings and reviews
- Template metadata and documentation
- Version management

Stay tuned for updates on the template registry feature!
