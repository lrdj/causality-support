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

// Add helper functions to res.locals for use in views
router.use((req, res, next) => {
  res.locals.getClusterColour = getClusterColour
  res.locals.getClusterLabel = getClusterLabel
  next()
})

// ============================================================================
// SESSION MANAGEMENT ROUTES
// ============================================================================

// View all sessions
router.get('/sessions', (req, res) => {
  res.render('sessions', {
    sessions: req.session.data.sessions || []
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

// Session dashboard
router.get('/session/:sessionId/dashboard', (req, res) => {
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
  
  res.render('dashboard', {
    session,
    tree,
    stats,
    shallowNodes,
    clusterCounts
  })
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

// ============================================================================
// CLUSTERING ROUTES
// ============================================================================

// Suggest clusters using LLM
router.get('/session/:sessionId/suggest-clusters', async (req, res) => {
  const session = findSession(req.session.data.sessions, req.params.sessionId)
  
  if (!session || !session.nodes || session.nodes.length < 5) {
    return res.redirect(`/session/${req.params.sessionId}/dashboard`)
  }
  
  try {
    const suggestions = await llmHelper.suggestClusters(session.nodes)
    
    if (suggestions.clusters && suggestions.clusters.length > 0) {
      // Create clusters
      suggestions.clusters.forEach(clusterSuggestion => {
        const cluster = dataHelper.createCluster(
          session.id,
          clusterSuggestion.label,
          null,
          clusterSuggestion.description || ''
        )
        dataHelper.addClusterToSession(session, cluster)
        
        // Assign nodes to cluster
        if (clusterSuggestion.node_indices) {
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
