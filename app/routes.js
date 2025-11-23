//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

// Import helper modules
const dataHelper = require('./lib/data-helper')
const llmHelper = require('./lib/llm-helper')

// Initialize sessions storage if it doesn't exist
router.use((req, res, next) => {
  if (!req.session.data.sessions) {
    req.session.data.sessions = []
  }
  next()
})

// Helper function to find session by ID
function findSession(sessions, sessionId) {
  return sessions.find(s => s.id === sessionId)
}

// Helper function to get cluster colour
function getClusterColour(session, clusterId) {
  const cluster = session.clusters.find(c => c.id === clusterId)
  return cluster ? cluster.colour : '#b1b4b6'
}

// Helper function to get cluster label
function getClusterLabel(session, clusterId) {
  const cluster = session.clusters.find(c => c.id === clusterId)
  return cluster ? cluster.label : 'Unclustered'
}

// Agency helpers
function getAgencyLabel(agency) {
  const map = { unset: 'Agency not set', low: 'Low agency', med: 'Some agency', high: 'High agency' }
  return map[agency] || null
}
function getAgencyBackground(agency) {
  switch (agency) {
    case 'low': return '#f3d2d2' // light red tint
    case 'med': return '#fff4e5' // light amber tint
    case 'high': return '#e0f3e8' // light green tint
    case 'unset':
    default: return '#f3f2f1'
  }
}
function getAgencyColour(agency) {
  switch (agency) {
    case 'low': return '#d4351c' // govuk red
    case 'med': return '#ffbf47' // govuk amber
    case 'med': return '#ffbf47' // govuk amber
    case 'high': return '#00703c' // govuk green
    default: return '#b1b4b6'
  }
}

// Add helper functions to res.locals for use in views
router.use((req, res, next) => {
  res.locals.getClusterColour = getClusterColour
  res.locals.getClusterLabel = getClusterLabel
  res.locals.getAgencyLabel = getAgencyLabel
  res.locals.getAgencyBackground = getAgencyBackground
  res.locals.getAgencyColour = getAgencyColour
  next()
})

// ============================================================================
// SESSION MANAGEMENT ROUTES
// ============================================================================

// View all sessions
router.get('/sessions', (req, res) => {
  res.render('sessions', {
    sessions: req.session.data.sessions || [],
    renamed: req.query.renamed || null
  })
})

// New session form
router.get('/session/new', (req, res) => {
  res.render('session-new')
})

// Create new session
router.post('/session/create', (req, res) => {
  const { sessionTitle, facilitatorName, initialSeed } = req.body
  
  const session = dataHelper.createSession(sessionTitle, facilitatorName)
  
  // If initial seed provided, create root node
  if (initialSeed && initialSeed.trim()) {
    const rootNode = dataHelper.createNode(session.id, initialSeed.trim(), null, 'facilitator')
    dataHelper.addNodeToSession(session, rootNode)
    session.root_node_id = rootNode.id
  }
  
  req.session.data.sessions.push(session)
  
  res.redirect(`/session/${session.id}/dashboard`)
})

// ============================================================================
// DASHBOARD ROUTES
// ============================================================================

// Workspace (main facilitator page)
router.get('/session/:sessionId/workspace', (req, res) => {
  const session = findSession(req.session.data.sessions, req.params.sessionId)
  
  if (!session) {
    return res.redirect('/sessions')
  }
  
  const tree = dataHelper.buildTree(session)
  const stats = dataHelper.getSessionStats(session)
  const shallowNodes = dataHelper.getShallowNodes(session, 3)
  
  // Calculate cluster counts
  const clusterCounts = {}
  if (session.clusters) {
    session.clusters.forEach(cluster => {
      clusterCounts[cluster.id] = dataHelper.getNodesInCluster(session, cluster.id).length
    })
  }
  // Calculate agency counts
  const agencyCounts = { unset: 0, low: 0, med: 0, high: 0 }
  ;(session.nodes || []).forEach(n => {
    if (!n.agency) agencyCounts.unset++
    else if (agencyCounts[n.agency] !== undefined) agencyCounts[n.agency]++
  })
  
  res.render('workspace', {
    session,
    tree,
    stats,
    shallowNodes,
    clusterCounts,
    agencyCounts,
    renamed: req.query.renamed || null,
    editNodeId: req.query.editNode || null
  })
})

// Backwards-compatible path
router.get('/session/:sessionId/dashboard', (req, res) => {
  res.redirect(`/session/${req.params.sessionId}/workspace`)
})

// Update session phase
router.post('/session/:sessionId/update-phase', (req, res) => {
  const session = findSession(req.session.data.sessions, req.params.sessionId)
  
  if (session) {
    dataHelper.updatePhase(session, req.body.phase)
  }
  
  res.redirect(`/session/${req.params.sessionId}/dashboard`)
})

// ============================================================================
// PARTICIPANT ROUTES
// ============================================================================

// Participant view
router.get('/session/:sessionId/participant', (req, res) => {
  const session = findSession(req.session.data.sessions, req.params.sessionId)
  
  if (!session) {
    return res.redirect('/sessions')
  }
  
  // Get the most recent prompt log
  const promptLogs = session.prompt_logs || []
  const latestLog = promptLogs.length > 0 ? promptLogs[promptLogs.length - 1] : null
  
  // Get recent nodes for display
  const recentNodes = (session.nodes || []).slice(-5).reverse()
  
  res.render('participant', {
    session,
    currentPrompt: latestLog ? latestLog.prompt_text : null,
    currentNodeId: latestLog ? latestLog.node_id : null,
    recentNodes
  })
})

// Participant submit response
router.post('/session/:sessionId/participant/respond', async (req, res) => {
  const session = findSession(req.session.data.sessions, req.params.sessionId)
  const { response, nodeId } = req.body
  
  if (!session || !response) {
    return res.redirect(`/session/${req.params.sessionId}/participant`)
  }
  
  // Analyze the response
  const analysis = await llmHelper.analyzeResponse(response)
  
  // Create nodes based on analysis
  const parentNode = nodeId ? dataHelper.getNode(session, nodeId) : null
  const parentId = parentNode ? parentNode.id : null
  
  if (analysis.idea_count === 1) {
    const node = dataHelper.createNode(session.id, response, parentId, 'participant')
    dataHelper.addNodeToSession(session, node)
  } else {
    // Create multiple nodes
    analysis.ideas.forEach(idea => {
      const node = dataHelper.createNode(session.id, idea.text, parentId, 'participant')
      dataHelper.addNodeToSession(session, node)
    })
  }
  
  res.redirect(`/session/${req.params.sessionId}/participant`)
})

// ============================================================================
// RESPONSE MANAGEMENT ROUTES
// ============================================================================

// Add response form
router.get('/session/:sessionId/add-response', (req, res) => {
  const session = findSession(req.session.data.sessions, req.params.sessionId)
  const parentId = req.query.parentId
  const prompt = req.query.prompt || null
  // Mode can be 'deepen' (from /deepen), 'why_else' (sibling add), or default
  const mode = req.query.mode || (prompt ? 'deepen' : 'add')
  
  if (!session) {
    return res.redirect('/sessions')
  }
  
  const parentNode = parentId ? dataHelper.getNode(session, parentId) : null
  
  res.render('add-response', {
    session,
    parentNode,
    prompt,
    mode
  })
})

// Process response with LLM analysis
router.post('/session/:sessionId/process-response', async (req, res) => {
  const session = findSession(req.session.data.sessions, req.params.sessionId)
  const { response, parentId } = req.body
  
  if (!session || !response) {
    return res.redirect(`/session/${req.params.sessionId}/dashboard`)
  }
  
  try {
    // Analyze the response
    const analysis = await llmHelper.analyzeResponse(response)
    
    // Check for vagueness
    const vaguenessCheck = await llmHelper.checkVagueness(response)
    
    // Generate follow-up question
    const parentNode = parentId ? dataHelper.getNode(session, parentId) : null
    const depth = parentNode ? parentNode.level + 1 : 0
    const followUpQuestion = await llmHelper.generateFollowUp(response, depth)
    
    // Store for the analysis view
    req.session.data.tempAnalysis = {
      originalResponse: response,
      parentId: parentId || null,
      analysis,
      vaguenessCheck,
      followUpQuestion
    }
    
    res.redirect(`/session/${req.params.sessionId}/response-analysis`)
  } catch (error) {
    console.error('Error processing response:', error)
    // Fallback: create single node
    const node = dataHelper.createNode(session.id, response, parentId || null, 'participant')
    dataHelper.addNodeToSession(session, node)
    res.redirect(`/session/${req.params.sessionId}/dashboard`)
  }
})

// Show response analysis
router.get('/session/:sessionId/response-analysis', (req, res) => {
  const session = findSession(req.session.data.sessions, req.params.sessionId)
  const tempAnalysis = req.session.data.tempAnalysis
  
  if (!session || !tempAnalysis) {
    return res.redirect(`/session/${req.params.sessionId}/dashboard`)
  }
  
  res.render('response-analysis', {
    session,
    originalResponse: tempAnalysis.originalResponse,
    parentId: tempAnalysis.parentId,
    analysis: tempAnalysis.analysis,
    vaguenessCheck: tempAnalysis.vaguenessCheck,
    followUpQuestion: tempAnalysis.followUpQuestion
  })
})

// Create multiple nodes from split ideas
router.post('/session/:sessionId/create-nodes', (req, res) => {
  const session = findSession(req.session.data.sessions, req.params.sessionId)
  const { ideas, parentId, originalResponse } = req.body
  
  if (!session) {
    return res.redirect('/sessions')
  }
  
  // Ideas come as an array from the form
  const ideaTexts = Array.isArray(ideas) ? ideas : [ideas]
  
  ideaTexts.forEach(text => {
    if (text && text.trim()) {
      const node = dataHelper.createNode(session.id, text.trim(), parentId || null, 'participant')
      dataHelper.addNodeToSession(session, node)
    }
  })
  
  // Clear temp analysis
  delete req.session.data.tempAnalysis
  
  res.redirect(`/session/${req.params.sessionId}/dashboard`)
})

// Create single node
router.post('/session/:sessionId/create-single-node', (req, res) => {
  const session = findSession(req.session.data.sessions, req.params.sessionId)
  const { text, parentId } = req.body
  
  if (!session || !text) {
    return res.redirect(`/session/${req.params.sessionId}/dashboard`)
  }
  
  const node = dataHelper.createNode(session.id, text, parentId || null, 'participant')
  dataHelper.addNodeToSession(session, node)
  
  // Clear temp analysis
  delete req.session.data.tempAnalysis
  
  res.redirect(`/session/${req.params.sessionId}/dashboard`)
})

// Create single node (GET version for quick links)
router.get('/session/:sessionId/create-single-node', (req, res) => {
  const session = findSession(req.session.data.sessions, req.params.sessionId)
  const { text, parentId } = req.query
  
  if (!session || !text) {
    return res.redirect(`/session/${req.params.sessionId}/dashboard`)
  }
  
  const node = dataHelper.createNode(session.id, text, parentId || null, 'participant')
  dataHelper.addNodeToSession(session, node)
  
  // Clear temp analysis
  delete req.session.data.tempAnalysis
  
  res.redirect(`/session/${req.params.sessionId}/dashboard`)
})

// ============================================================================
// NODE MANAGEMENT ROUTES
// ============================================================================

// Deepen a node (generate follow-up question)
router.get('/session/:sessionId/node/:nodeId/deepen', async (req, res) => {
  const session = findSession(req.session.data.sessions, req.params.sessionId)
  const node = dataHelper.getNode(session, req.params.nodeId)
  
  if (!session || !node) {
    return res.redirect(`/session/${req.params.sessionId}/dashboard`)
  }
  
  try {
    const followUpQuestion = await llmHelper.generateFollowUp(node.text, node.level)
    
    // Log the prompt
    const promptLog = dataHelper.createPromptLog(session.id, node.id, followUpQuestion)
    dataHelper.addPromptLog(session, promptLog)
    
    // Redirect to add response with this node as parent
    res.redirect(`/session/${req.params.sessionId}/add-response?parentId=${node.id}&prompt=${encodeURIComponent(followUpQuestion)}`)
  } catch (error) {
    console.error('Error generating follow-up:', error)
    res.redirect(`/session/${req.params.sessionId}/dashboard`)
  }
})

// Respond to a node
router.get('/session/:sessionId/node/:nodeId/respond', (req, res) => {
  res.redirect(`/session/${req.params.sessionId}/add-response?parentId=${req.params.nodeId}`)
})

// Assign cluster (form)
router.get('/session/:sessionId/node/:nodeId/cluster', (req, res) => {
  const session = findSession(req.session.data.sessions, req.params.sessionId)
  if (!session) return res.redirect('/sessions')

  const node = dataHelper.getNode(session, req.params.nodeId)
  if (!node) return res.redirect(`/session/${req.params.sessionId}/dashboard`)

  const clusterItems = [
    { value: 'none', text: 'No cluster', selected: !node.cluster_id }
  ].concat(
    (session.clusters || []).map(c => ({
      value: c.id,
      text: c.label + (c.description ? ` — ${c.description}` : ''),
      selected: !!node.cluster_id && node.cluster_id === c.id
    }))
  )

  res.render('assign-cluster', {
    session,
    node,
    clusterItems
  })
})

// Assign cluster (submit)
router.post('/session/:sessionId/node/:nodeId/cluster', (req, res) => {
  const session = findSession(req.session.data.sessions, req.params.sessionId)
  if (!session) return res.redirect('/sessions')

  const node = dataHelper.getNode(session, req.params.nodeId)
  if (!node) return res.redirect(`/session/${req.params.sessionId}/dashboard`)

  const { clusterId } = req.body
  if (!clusterId || clusterId === 'none') {
    // Clear cluster assignment
    dataHelper.assignNodeToCluster(session, node.id, null)
  } else {
    dataHelper.assignNodeToCluster(session, node.id, clusterId)
  }

  res.redirect(`/session/${req.params.sessionId}/dashboard`)
})

// Delete a node and its subtree
router.get('/session/:sessionId/node/:nodeId/delete', (req, res) => {
  const session = findSession(req.session.data.sessions, req.params.sessionId)
  if (!session) {
    return res.redirect('/sessions')
  }

  const nodeId = req.params.nodeId
  // Perform deletion
  dataHelper.deleteNode(session, nodeId)

  // Clear any temp analysis to avoid referencing deleted nodes
  delete req.session.data.tempAnalysis

  res.redirect(`/session/${req.params.sessionId}/dashboard`)
})

// Set agency (form)
router.get('/session/:sessionId/node/:nodeId/agency', (req, res) => {
  const session = findSession(req.session.data.sessions, req.params.sessionId)
  if (!session) return res.redirect('/sessions')
  const node = dataHelper.getNode(session, req.params.nodeId)
  if (!node) return res.redirect(`/session/${req.params.sessionId}/dashboard`)
  res.render('assign-agency', { session, node, current: node.agency || 'unset' })
})

// Set agency (submit)
router.post('/session/:sessionId/node/:nodeId/agency', (req, res) => {
  const session = findSession(req.session.data.sessions, req.params.sessionId)
  if (!session) return res.redirect('/sessions')
  const node = dataHelper.getNode(session, req.params.nodeId)
  if (!node) return res.redirect(`/session/${req.params.sessionId}/dashboard`)
  const allowed = ['unset', 'low', 'med', 'high']
  const { agency } = req.body
  if (allowed.includes(agency)) {
    node.agency = (agency === 'unset') ? null : agency
  } else {
    node.agency = null
  }
  res.redirect(`/session/${req.params.sessionId}/dashboard`)
})

// Update node text
router.post('/session/:sessionId/node/:nodeId/update-text', (req, res) => {
  const session = findSession(req.session.data.sessions, req.params.sessionId)
  if (!session) return res.redirect('/sessions')
  const node = dataHelper.getNode(session, req.params.nodeId)
  if (!node) return res.redirect(`/session/${req.params.sessionId}/workspace`)

  const text = (req.body.text || '').trim()
  if (text.length > 0) {
    node.text = text
  }
  res.redirect(`/session/${req.params.sessionId}/workspace#node-${node.id}`)
})

// ============================================================================
// CLUSTERING ROUTES
// ============================================================================

// Suggest clusters using LLM
// Refresh clusters (destructive): clears previous clusters and reassigns based on LLM
router.get('/session/:sessionId/refresh-clusters', async (req, res) => {
  const session = findSession(req.session.data.sessions, req.params.sessionId)
  
  if (!session || !session.nodes || session.nodes.length < 5) {
    return res.redirect(`/session/${req.params.sessionId}/dashboard`)
  }
  
  try {
    const suggestions = await llmHelper.suggestClusters(session.nodes)

    if (suggestions.clusters && suggestions.clusters.length > 0) {
      // Destructive refresh: clear existing clusters and assignments first
      session.clusters = []
      if (session.nodes) {
        session.nodes.forEach(n => { n.cluster_id = null })
      }

      // Prepare a shuffled colour palette to avoid duplicates while appearing random
      const palette = [
        '#F6D365', // Yellow
        '#FDA085', // Orange
        '#A8E6CF', // Green
        '#FFB3BA', // Pink
        '#BAE1FF', // Blue
        '#FFFFBA', // Light Yellow
        '#E0BBE4'  // Purple
      ]
      // Fisher–Yates shuffle
      for (let i = palette.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const tmp = palette[i]
        palette[i] = palette[j]
        palette[j] = tmp
      }
      let colourIndex = 0

      // Create clusters from suggestions and assign nodes
      suggestions.clusters.forEach(clusterSuggestion => {
        const colour = palette[colourIndex % palette.length]
        colourIndex++
        const cluster = dataHelper.createCluster(
          session.id,
          clusterSuggestion.label,
          colour,
          clusterSuggestion.description || ''
        )
        dataHelper.addClusterToSession(session, cluster)

        if (Array.isArray(clusterSuggestion.node_indices)) {
          clusterSuggestion.node_indices.forEach(index => {
            if (session.nodes[index]) {
              dataHelper.assignNodeToCluster(session, session.nodes[index].id, cluster.id)
            }
          })
        }
      })
    }
    
    res.redirect(`/session/${req.params.sessionId}/dashboard`)
  } catch (error) {
    console.error('Error suggesting clusters:', error)
    res.redirect(`/session/${req.params.sessionId}/dashboard`)
  }
})

// Backwards-compatible redirect from old route name
router.get('/session/:sessionId/suggest-clusters', (req, res) => {
  res.redirect(`/session/${req.params.sessionId}/refresh-clusters`)
})

// ============================================================================
// REFLECTION ROUTES
// ============================================================================

// View reflection
router.get('/session/:sessionId/reflection', (req, res) => {
  const session = findSession(req.session.data.sessions, req.params.sessionId)
  
  if (!session) {
    return res.redirect('/sessions')
  }
  
  const stats = dataHelper.getSessionStats(session)
  
  // Calculate cluster counts
  const clusterCounts = {}
  if (session.clusters) {
    session.clusters.forEach(cluster => {
      clusterCounts[cluster.id] = dataHelper.getNodesInCluster(session, cluster.id).length
    })
  }
  
  res.render('reflection', {
    session,
    stats,
    clusterCounts,
    reflection: session.reflection || null
  })
})

// Generate reflection using LLM
router.post('/session/:sessionId/generate-reflection', async (req, res) => {
  const session = findSession(req.session.data.sessions, req.params.sessionId)
  
  if (!session) {
    return res.redirect('/sessions')
  }
  
  try {
    const reflection = await llmHelper.generateReflection(session)
    session.reflection = reflection
    
    res.redirect(`/session/${req.params.sessionId}/reflection`)
  } catch (error) {
    console.error('Error generating reflection:', error)
    res.redirect(`/session/${req.params.sessionId}/dashboard`)
  }
})

module.exports = router

// ============================================================================
// TITLE UPDATE ROUTE
// ============================================================================

// Update session title
router.post('/session/:sessionId/update-title', (req, res) => {
  const sessions = req.session.data.sessions || []
  const session = findSession(sessions, req.params.sessionId)
  if (!session) {
    return res.redirect('/sessions')
  }

  const title = (req.body.title || '').trim()
  if (title.length > 0) {
    session.title = title.slice(0, 120)
  }

  return res.redirect(`/sessions?renamed=1`)
})

// Edit title form
router.get('/session/:sessionId/edit-title', (req, res) => {
  const session = findSession(req.session.data.sessions, req.params.sessionId)
  if (!session) return res.redirect('/sessions')
  res.render('session-rename', { session })
})

// Reset the tree for a session (clears nodes, clusters, prompts, reflection)
router.get('/session/:sessionId/reset-tree', (req, res) => {
  const session = findSession(req.session.data.sessions, req.params.sessionId)
  if (!session) {
    return res.redirect('/sessions')
  }

  // Clear causal content
  session.nodes = []
  session.clusters = []
  session.prompt_logs = []
  session.reflection = null
  session.root_node_id = null
  session.phase = 'seeding'

  delete req.session.data.tempAnalysis

  res.redirect(`/session/${req.params.sessionId}/dashboard`)
})

// ============================================================================
// EXPORT / IMPORT ROUTES
// ============================================================================

// Export a session as JSON download
router.get('/session/:sessionId/export', (req, res) => {
  const session = findSession(req.session.data.sessions, req.params.sessionId)
  if (!session) {
    return res.redirect('/sessions')
  }

  const safeTitle = (session.title || 'session').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  const filename = `${safeTitle || 'session'}-${session.id}.json`

  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.send(JSON.stringify(session, null, 2))
})

// Import session (form)
router.get('/session/import', (req, res) => {
  res.render('session-import', {
    error: req.query.error || null
  })
})

// Import session (submit)
router.post('/session/import', (req, res) => {
  const { sessionJson } = req.body || {}
  if (!sessionJson || !sessionJson.trim()) {
    return res.redirect('/session/import?error=' + encodeURIComponent('Paste a session JSON to import.'))
  }

  try {
    const parsed = JSON.parse(sessionJson)
    const sessions = req.session.data.sessions || []

    // Basic normalization
    const session = {
      id: parsed.id || dataHelper.generateId('session'),
      title: parsed.title || 'Imported session',
      facilitator_name: parsed.facilitator_name || 'Facilitator',
      phase: parsed.phase || 'seeding',
      created_at: parsed.created_at || new Date().toISOString(),
      root_node_id: parsed.root_node_id || null,
      nodes: parsed.nodes || [],
      clusters: parsed.clusters || [],
      prompt_logs: parsed.prompt_logs || [],
      reflection: parsed.reflection || null
    }

    // If ID collides, generate a new one and note import
    if (sessions.find(s => s.id === session.id)) {
      session.id = dataHelper.generateId('session')
      session.title = (session.title || 'Imported session') + ' (imported)'
    }

    sessions.push(session)
    req.session.data.sessions = sessions
    return res.redirect('/sessions')
  } catch (e) {
    return res.redirect('/session/import?error=' + encodeURIComponent('Invalid JSON. Please check and try again.'))
  }
})

// Create a sample session from bundled JSON
router.get('/session/create-sample', (req, res) => {
  const fs = require('fs')
  const path = require('path')
  const samplePath = path.join(process.cwd(), 'app', 'sample-sessions', 'career.json')
  try {
    const raw = fs.readFileSync(samplePath, 'utf8')
    const parsed = JSON.parse(raw)
    const sessions = req.session.data.sessions || []

    const session = {
      id: dataHelper.generateId('session'),
      title: parsed.title || 'Sample session',
      facilitator_name: parsed.facilitator_name || 'Facilitator',
      phase: parsed.phase || 'growing',
      created_at: new Date().toISOString(),
      root_node_id: null,
      nodes: [],
      clusters: parsed.clusters || [],
      prompt_logs: [],
      reflection: null
    }

    // Re-id nodes to avoid collisions and wire parent/levels
    const idMap = {}
    parsed.nodes.forEach(n => { idMap[n.id] = dataHelper.generateId('node') })
    const now = Date.now()
    // First pass create nodes
    parsed.nodes.forEach(n => {
      const parentId = n.parent_id ? idMap[n.parent_id] : null
      const node = {
        id: idMap[n.id],
        session_id: session.id,
        parent_id: parentId,
        text: n.text,
        level: 0,
        author_id: n.author_id || 'participant',
        created_at: new Date(now).toISOString(),
        tags: [],
        cluster_id: null
      }
      dataHelper.addNodeToSession(session, node)
    })

    // Set root if present
    const root = dataHelper.getRootNode(session)
    if (root) session.root_node_id = root.id

    sessions.push(session)
    req.session.data.sessions = sessions
    res.redirect(`/session/${session.id}/dashboard`)
  } catch (e) {
    console.error('Error creating sample session', e)
    res.redirect('/sessions')
  }
})
