/**
 * Data helper functions for managing sessions, nodes, and clusters
 */

const { v4: uuidv4 } = require('uuid');

// Generate unique IDs
function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Initialize a new session
 */
function createSession(title, facilitatorName) {
  const sessionId = generateId('session');
  const rootNodeId = generateId('node');
  
  return {
    id: sessionId,
    title: title || 'Untitled Session',
    root_node_id: rootNodeId,
    facilitator_name: facilitatorName || 'Facilitator',
    phase: 'seeding', // seeding | growing | deepening | clustering | reflection
    created_at: new Date().toISOString(),
    nodes: [],
    clusters: [],
    prompt_logs: []
  };
}

/**
 * Create a new node
 */
function createNode(sessionId, text, parentId = null, authorId = 'participant') {
  const nodeId = generateId('node');
  
  // Calculate level based on parent
  let level = 0;
  if (parentId) {
    // This will be calculated when we have access to the full session
    level = 1; // Placeholder
  }
  
  return {
    id: nodeId,
    session_id: sessionId,
    parent_id: parentId,
    text: text,
    level: level,
    author_id: authorId,
    created_at: new Date().toISOString(),
    tags: [],
    cluster_id: null,
    agency: null,
    needs_deepening: true,
    children: []
  };
}

/**
 * Create a new cluster
 */
function createCluster(sessionId, label, colour = null, description = '') {
  const clusterId = generateId('cluster');
  
  const colours = [
    '#F6D365', // Yellow
    '#FDA085', // Orange
    '#A8E6CF', // Green
    '#FFB3BA', // Pink
    '#BAE1FF', // Blue
    '#FFFFBA', // Light Yellow
    '#E0BBE4'  // Purple
  ];
  
  return {
    id: clusterId,
    session_id: sessionId,
    label: label,
    colour: colour || colours[Math.floor(Math.random() * colours.length)],
    description: description,
    created_at: new Date().toISOString()
  };
}

/**
 * Create a prompt log entry
 */
function createPromptLog(sessionId, nodeId, promptText, responseText = null) {
  return {
    id: generateId('pl'),
    session_id: sessionId,
    node_id: nodeId,
    prompt_text: promptText,
    response_text: responseText,
    timestamp: new Date().toISOString()
  };
}

/**
 * Add a node to a session
 */
function addNodeToSession(session, node) {
  if (!session.nodes) {
    session.nodes = [];
  }
  
  // Calculate proper level
  if (node.parent_id) {
    const parent = session.nodes.find(n => n.id === node.parent_id);
    if (parent) {
      node.level = parent.level + 1;
      // Add to parent's children
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(node.id);
    }
  } else {
    node.level = 0;
    // Ensure root is recorded if not set
    if (!session.root_node_id) {
      session.root_node_id = node.id;
    }
  }
  
  session.nodes.push(node);
  return node;
}

/**
 * Get a node by ID
 */
function getNode(session, nodeId) {
  if (!session.nodes) return null;
  return session.nodes.find(n => n.id === nodeId);
}

/**
 * Get all children of a node
 */
function getChildren(session, nodeId) {
  if (!session.nodes) return [];
  return session.nodes.filter(n => n.parent_id === nodeId);
}

/**
 * Get the root node
 */
function getRootNode(session) {
  if (!session.nodes || session.nodes.length === 0) return null;
  return session.nodes.find(n => n.parent_id === null || n.level === 0);
}

/**
 * Build a tree structure from flat nodes
 */
function buildTree(session) {
  if (!session.nodes || session.nodes.length === 0) return null;
  
  const nodeMap = {};
  session.nodes.forEach(node => {
    nodeMap[node.id] = { ...node, children: [] };
  });
  
  let root = null;
  session.nodes.forEach(node => {
    if (node.parent_id && nodeMap[node.parent_id]) {
      nodeMap[node.parent_id].children.push(nodeMap[node.id]);
    } else if (!node.parent_id || node.level === 0) {
      root = nodeMap[node.id];
    }
  });
  
  return root;
}

/**
 * Get nodes that need deepening (shallow branches)
 */
function getShallowNodes(session, minDepth = 3) {
  if (!session.nodes) return [];
  
  return session.nodes.filter(node => {
    const children = getChildren(session, node.id);
    return children.length === 0 && node.level < minDepth;
  });
}

/**
 * Add a cluster to session
 */
function addClusterToSession(session, cluster) {
  if (!session.clusters) {
    session.clusters = [];
  }
  session.clusters.push(cluster);
  return cluster;
}

/**
 * Assign node to cluster
 */
function assignNodeToCluster(session, nodeId, clusterId) {
  const node = getNode(session, nodeId);
  if (node) {
    node.cluster_id = clusterId;
  }
  return node;
}

/**
 * Get nodes in a cluster
 */
function getNodesInCluster(session, clusterId) {
  if (!session.nodes) return [];
  return session.nodes.filter(n => n.cluster_id === clusterId);
}

/**
 * Add a prompt log
 */
function addPromptLog(session, log) {
  if (!session.prompt_logs) {
    session.prompt_logs = [];
  }
  session.prompt_logs.push(log);
  return log;
}

/**
 * Update session phase
 */
function updatePhase(session, newPhase) {
  const validPhases = ['seeding', 'growing', 'deepening', 'clustering', 'reflection'];
  if (validPhases.includes(newPhase)) {
    session.phase = newPhase;
  }
  return session;
}

/**
 * Get session statistics
 */
function getSessionStats(session) {
  const nodes = session.nodes || [];
  const clusters = session.clusters || [];
  
  return {
    total_nodes: nodes.length,
    total_clusters: clusters.length,
    max_depth: nodes.length > 0 ? Math.max(...nodes.map(n => n.level)) : 0,
    shallow_nodes: getShallowNodes(session).length,
    unclustered_nodes: nodes.filter(n => !n.cluster_id).length
  };
}

/**
 * Delete a node and its entire subtree from the session
 * - Removes the node and all descendants from session.nodes
 * - Updates parent's children array
 * - Clears root_node_id if the root is deleted
 */
function deleteNode(session, nodeId) {
  if (!session || !session.nodes || session.nodes.length === 0) return;

  // Build a set of nodes to delete (node + descendants)
  const toDelete = new Set();
  const collect = (id) => {
    toDelete.add(id);
    session.nodes
      .filter(n => n.parent_id === id)
      .forEach(child => collect(child.id));
  };
  collect(nodeId);

  // Remove reference from parent.children
  const node = session.nodes.find(n => n.id === nodeId);
  if (node && node.parent_id) {
    const parent = session.nodes.find(n => n.id === node.parent_id);
    if (parent && Array.isArray(parent.children)) {
      parent.children = parent.children.filter(cid => cid !== nodeId);
    }
  }

  // Filter out all nodes to delete
  session.nodes = session.nodes.filter(n => !toDelete.has(n.id));

  // If we deleted the root, clear root_node_id
  if (session.root_node_id && toDelete.has(session.root_node_id)) {
    session.root_node_id = null;
  }

  return true;
}

module.exports = {
  generateId,
  createSession,
  createNode,
  createCluster,
  createPromptLog,
  addNodeToSession,
  getNode,
  getChildren,
  getRootNode,
  buildTree,
  getShallowNodes,
  addClusterToSession,
  assignNodeToCluster,
  getNodesInCluster,
  addPromptLog,
  updatePhase,
  getSessionStats,
  deleteNode
};
