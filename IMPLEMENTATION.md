# Causality Garden Tool - Implementation Summary

## Overview

A complete GOV.UK Prototype Kit-based facilitation tool for running remote Causality Garden workshops with AI-powered assistance.

## What Was Built

### 1. Core Infrastructure

**Data Model** (`app/lib/data-helper.js`)
- Session management with 5 phases (seeding, growing, deepening, clustering, reflection)
- Node-based tree structure for causal relationships
- Cluster management for theme organization
- Prompt logging for tracking facilitator questions
- Tree building and statistics functions

**LLM Integration** (`app/lib/llm-helper.js`)
- Response analysis (detect multiple ideas, split suggestions)
- Vagueness detection and nudging
- Follow-up question generation based on depth
- Automatic cluster suggestions
- Reflection summary generation
- Uses OpenAI API (gpt-4.1-mini model)

### 2. Views and User Interface

**Homepage** (`app/views/index.html`)
- Introduction to Causality Garden method
- Overview of 5 phases
- Links to create/view sessions

**Session Management**
- `session-new.html` - Create new session form
- `sessions.html` - List all sessions with stats
- `dashboard.html` - Main facilitator dashboard with tree visualization

**Participant Interface**
- `participant.html` - Simplified view for participants
- Shows current prompt and response form
- Displays journey so far

**Response Processing**
- `add-response.html` - Form for adding participant responses
- `response-analysis.html` - Shows LLM analysis with split suggestions

**Reflection**
- `reflection.html` - Session summary and AI-generated insights

**Components**
- `partials/tree-node.html` - Recursive tree rendering component

### 3. Routes and Logic (`app/routes.js`)

**Session Management**
- `GET /sessions` - List all sessions
- `GET /session/new` - New session form
- `POST /session/create` - Create session
- `GET /session/:id/dashboard` - Main dashboard
- `POST /session/:id/update-phase` - Change session phase

**Participant Flow**
- `GET /session/:id/participant` - Participant view
- `POST /session/:id/participant/respond` - Submit response

**Response Management**
- `GET /session/:id/add-response` - Add response form
- `POST /session/:id/process-response` - Analyze with LLM
- `GET /session/:id/response-analysis` - View analysis
- `POST /session/:id/create-nodes` - Create multiple nodes
- `POST /session/:id/create-single-node` - Create single node

**Node Operations**
- `GET /session/:id/node/:nodeId/deepen` - Generate follow-up question
- `GET /session/:id/node/:nodeId/respond` - Add response to node

**Clustering**
- `GET /session/:id/suggest-clusters` - AI-powered clustering

**Reflection**
- `GET /session/:id/reflection` - View reflection
- `POST /session/:id/generate-reflection` - Generate AI summary

### 4. Styling (`app/assets/sass/application.scss`)

Custom CSS for:
- Tree node visualization with hover effects
- Cluster colour badges
- Stats panels
- Prompt displays
- Analysis cards
- Responsive layouts
- Print-friendly reflection pages

### 5. Configuration

**Updated Files:**
- `app/config.json` - Service name set to "Causality Garden"
- `package.json` - Added dependencies: openai, uuid

## Key Features

### 🤖 AI-Powered Analysis

1. **Response Splitting**
   - Detects when participants mix multiple ideas
   - Suggests splitting into separate nodes
   - Classifies each idea (concrete situation, inferred cause, vague feeling)

2. **Vagueness Detection**
   - Identifies unclear or non-specific responses
   - Generates supportive nudges for clarification

3. **Follow-up Generation**
   - Creates depth-appropriate questions
   - Adapts based on node level in tree
   - Encourages exploration to root causes

4. **Automatic Clustering**
   - Analyzes all nodes to suggest themes
   - Proposes standard labels (Identity, Environment, Growth, Security, Relationships)
   - Can create custom cluster names when appropriate

5. **Reflection Generation**
   - Synthesizes session insights
   - Identifies patterns and tensions
   - Suggests next steps

### 📊 Facilitator Dashboard

- **Real-time stats**: Total nodes, max depth, clusters, shallow nodes
- **Tree visualization**: Hierarchical view with colour-coded clusters
- **Quick actions**: Add responses, suggest clusters, generate reflections
- **Phase management**: Switch between 5 workshop phases
- **Shallow node warnings**: Highlights branches needing deeper exploration

### 👥 Participant Experience

- Clean, focused interface
- Current question prominently displayed
- Simple response form
- Journey tracking (recent responses)
- No distracting facilitator controls

### 🎨 Design

- Built on GOV.UK Design System (accessible, responsive, professional)
- Custom styling for causality-specific components
- Colour-coded clusters for visual organization
- Print-friendly reflection pages

## Technical Architecture

### Data Storage

- **Session-based storage**: Uses GOV.UK Prototype Kit's built-in session management
- **In-memory**: Data persists during browser session
- **No database required**: Perfect for prototyping and workshops

### Data Flow

1. **Participant submits response** → 
2. **LLM analyzes** (split detection, vagueness check) → 
3. **Facilitator reviews** analysis → 
4. **Nodes created** in tree → 
5. **Follow-up generated** → 
6. **Cycle repeats** until depth reached

### LLM Integration

- **Model**: gpt-4.1-mini (fast, cost-effective)
- **API**: OpenAI-compatible (pre-configured in environment)
- **Fallbacks**: Graceful degradation if API fails
- **Prompts**: Structured, role-based system prompts

## Installation & Setup

### Prerequisites

- Node.js 22.x (pre-installed in sandbox)
- npm or pnpm

### Local Setup

```bash
cd /Users/dug/Sites/causality-support

# Install dependencies
npm install

# Set OpenAI API key (if not already in environment)
export OPENAI_API_KEY=your_key_here

# Run development server
npm run dev

# Access at http://localhost:3000
```

### Dependencies Added

- `openai` - OpenAI API client
- `uuid` - Unique ID generation

## Usage Guide

### Creating a Session

1. Click "Start a new session"
2. Enter session title and facilitator name
3. Optionally add initial seed (the starting problem/feeling)
4. Click "Create session"

### Running a Workshop

1. **Seeding Phase**
   - Capture the initial problem/feeling
   - Create root node

2. **Growing Roots Phase**
   - Ask "Why might that be?"
   - Add participant responses
   - System detects and suggests splits
   - Create first-level causes

3. **Deepening Branches Phase**
   - Select interesting nodes
   - Click "Deepen" to generate follow-up questions
   - Continue adding responses
   - Aim for depth of 3+ levels

4. **Clustering Phase**
   - Click "Suggest clusters"
   - AI analyzes all nodes and proposes themes
   - Review and accept cluster assignments
   - Nodes are colour-coded by cluster

5. **Reflection Phase**
   - Click "Generate reflection"
   - AI creates summary of insights
   - Review patterns and tensions
   - Identify next steps
   - Print or export

### Participant View

- Share the participant URL: `/session/{id}/participant`
- Participant sees current question
- They submit responses
- Facilitator reviews in dashboard

## File Structure

```
causality-support/
├── app/
│   ├── assets/
│   │   └── sass/
│   │       └── application.scss          # Custom styles
│   ├── lib/
│   │   ├── data-helper.js                # Data model & utilities
│   │   └── llm-helper.js                 # AI integration
│   ├── views/
│   │   ├── index.html                    # Homepage
│   │   ├── session-new.html              # Create session
│   │   ├── sessions.html                 # List sessions
│   │   ├── dashboard.html                # Main facilitator view
│   │   ├── participant.html              # Participant interface
│   │   ├── add-response.html             # Add response form
│   │   ├── response-analysis.html        # LLM analysis view
│   │   ├── reflection.html               # Session reflection
│   │   └── partials/
│   │       └── tree-node.html            # Tree component
│   ├── config.json                       # Service configuration
│   └── routes.js                         # All route handlers
├── package.json                          # Dependencies
└── README.md                             # Original readme
```

## API Integration

### OpenAI API Usage

The tool uses the OpenAI API (pre-configured in environment) with these functions:

- `analyzeResponse(text)` - Split detection
- `generateFollowUp(text, depth)` - Question generation
- `checkVagueness(text)` - Vagueness detection
- `suggestClusters(nodes)` - Theme clustering
- `generateReflection(session)` - Summary generation

### Error Handling

- All LLM calls have try-catch blocks
- Fallback responses if API fails
- Graceful degradation (single node creation if analysis fails)

## Testing

### Manual Testing Checklist

- [x] Create session with initial seed
- [x] View dashboard with stats
- [x] Add response (single idea)
- [ ] Add response (multiple ideas - test splitting)
- [ ] Generate follow-up question
- [ ] Create deep branch (3+ levels)
- [ ] Suggest clusters (needs 5+ nodes)
- [ ] Generate reflection
- [ ] View participant interface
- [ ] Change session phase
- [ ] View sessions list

### Test Scenarios

1. **Career Exploration**
   - Seed: "I feel stuck in my current job"
   - Expected: Branches around growth, security, environment

2. **Service Design**
   - Seed: "Users are confused by our onboarding"
   - Expected: Branches around UX, communication, expectations

3. **Team Dynamics**
   - Seed: "The team feels disconnected"
   - Expected: Branches around relationships, communication, trust

## Known Limitations

1. **Data Persistence**: Session data is stored in browser session only
   - Lost on browser close
   - Not shared between devices
   - For production, add database storage

2. **Date Formatting**: Currently shows ISO timestamps
   - Nunjucks date filter not available in prototype kit
   - Can add custom filter if needed

3. **Cluster Assignment**: Manual assignment UI not yet built
   - Auto-suggestion works
   - Manual reassignment requires code

4. **Export**: No export to PDF/JSON yet
   - Can print reflection page
   - Can add export functionality

## Future Enhancements

### Short Term

- [ ] Add date formatting filter
- [ ] Manual cluster assignment UI
- [ ] Export to PDF/JSON
- [ ] Session data persistence (localStorage)
- [ ] Undo/edit node functionality

### Medium Term

- [ ] Database integration (SQLite/PostgreSQL)
- [ ] Multi-user sessions (real-time collaboration)
- [ ] Session templates
- [ ] Custom cluster colours
- [ ] Node linking (cross-branch connections)

### Long Term

- [ ] Visual graph editor (drag-and-drop)
- [ ] Session replay/playback
- [ ] Analytics dashboard
- [ ] Integration with Miro/Mural
- [ ] Mobile app

## Troubleshooting

### Server won't start

```bash
# Check Node version
node --version  # Should be 22.x

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### LLM not working

```bash
# Check OpenAI API key is set
echo $OPENAI_API_KEY

# Test API connection
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Template errors

- Check for syntax errors in .html files
- Ensure all `{% %}` tags are properly closed
- Check for undefined variables in templates

## Support

For issues or questions:
- Check GOV.UK Prototype Kit docs: https://prototype-kit.service.gov.uk/docs/
- Review error logs in terminal
- Check browser console for client-side errors

## Credits

- **GOV.UK Prototype Kit**: Base framework
- **GOV.UK Frontend**: Design system
- **OpenAI**: LLM integration
- **Causality Garden Method**: Workshop methodology

## License

See LICENCE.txt
