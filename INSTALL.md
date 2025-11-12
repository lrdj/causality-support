# Simple Installation Instructions

## What's in This Zip

All the files you need for the Causality Garden tool, ready to copy into your repository.

## Installation Steps

### 1. Extract the Zip

Extract `causality-files.zip` - you'll get a `causality-files` folder.

### 2. Copy Files to Your Repository

```bash
cd /Users/dug/Sites/causality-support

# Copy all app files (this will overwrite existing files and add new ones)
cp -r ~/Downloads/causality-files/app/* app/

# Copy package files
cp ~/Downloads/causality-files/package.json .
cp ~/Downloads/causality-files/package-lock.json .

# Copy documentation
cp ~/Downloads/causality-files/IMPLEMENTATION.md .
```

### 3. Install Dependencies

```bash
npm install
```

This will install the new dependencies: `openai` and `uuid`.

### 4. Set OpenAI API Key

```bash
export OPENAI_API_KEY=your_key_here
```

Or add to your `~/.zshrc`:
```bash
echo 'export OPENAI_API_KEY=your_key_here' >> ~/.zshrc
source ~/.zshrc
```

### 5. Run the Server

```bash
npm run dev
```

Visit http://localhost:3000

### 6. Test It Works

1. Click "Start a new session"
2. Fill in the form
3. You should see the dashboard with tree visualization
4. Try adding responses and exploring features

### 7. Commit and Push to GitHub

```bash
git add .
git commit -m "Add Causality Garden facilitation tool with LLM integration"
git push origin main
```

## What Files Were Added/Changed

### New Files (11)
- `app/lib/data-helper.js` - Data model and utilities
- `app/lib/llm-helper.js` - LLM integration
- `app/views/session-new.html` - Create session form
- `app/views/sessions.html` - List sessions
- `app/views/dashboard.html` - Main facilitator dashboard
- `app/views/participant.html` - Participant interface
- `app/views/add-response.html` - Add response form
- `app/views/response-analysis.html` - LLM analysis view
- `app/views/reflection.html` - Session reflection
- `app/views/partials/tree-node.html` - Tree component
- `IMPLEMENTATION.md` - Documentation

### Modified Files (5)
- `app/routes.js` - Complete rewrite with all endpoints
- `app/config.json` - Service name updated
- `app/views/index.html` - New homepage
- `app/assets/sass/application.scss` - Custom styles added
- `package.json` - Dependencies added (openai, uuid)

## Troubleshooting

### npm install fails
```bash
rm -rf node_modules package-lock.json
npm install
```

### Server won't start
Check for errors in the terminal. Most common issues:
- Missing dependencies (run `npm install`)
- Port 3000 already in use (kill other processes)

### LLM features don't work
- Check API key is set: `echo $OPENAI_API_KEY`
- Check you have internet connectivity
- Review terminal for error messages

## That's It!

Simple as that. All files are ready to copy over. No git magic needed.

For full documentation, see `IMPLEMENTATION.md`.
