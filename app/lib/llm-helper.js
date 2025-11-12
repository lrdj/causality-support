const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Analyze participant response to determine if it contains multiple ideas
 * @param {string} text - The participant's response
 * @returns {Promise<Object>} Analysis result with idea_count and ideas array
 */
async function analyzeResponse(text) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You will receive a single message from a workshop participant.

1. Tell me whether it contains 1 idea or multiple ideas.
2. If multiple, split into the smallest meaningful separate causes.
3. For each cause, tell me whether it is: concrete situation, inferred cause, or vague feeling.
4. Return JSON only in this format:
{
  "idea_count": number,
  "ideas": [
    {
      "text": "string",
      "type": "concrete_situation|inferred_cause|vague_feeling"
    }
  ]
}`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('Error analyzing response:', error);
    // Fallback: treat as single idea
    return {
      idea_count: 1,
      ideas: [{
        text: text,
        type: 'unknown'
      }]
    };
  }
}

/**
 * Generate a follow-up question to deepen exploration
 * @param {string} text - The node text
 * @param {number} depth - Current depth in the tree
 * @returns {Promise<string>} Follow-up question
 */
async function generateFollowUp(text, depth) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are assisting a causality-mapping session. I will give you the current node text and its depth (0 = root).
If depth < 3, generate ONE short follow-up question to go deeper.
If the text is vague, ask for an example.
Keep it under 18 words.
Return only the question, no other text.`
        },
        {
          role: 'user',
          content: JSON.stringify({ text, depth })
        }
      ],
      temperature: 0.7
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating follow-up:', error);
    // Fallback questions based on depth
    const fallbacks = [
      "Why might that be?",
      "What contributes to that?",
      "What makes that true?",
      "Can you give an example of when this happens?"
    ];
    return fallbacks[Math.min(depth, fallbacks.length - 1)];
  }
}

/**
 * Check if response is vague and generate a nudge
 * @param {string} text - The participant's response
 * @returns {Promise<Object>} { isVague: boolean, nudge: string|null }
 */
async function checkVagueness(text) {
  const vaguePatterns = [
    /i don't know/i,
    /not sure/i,
    /maybe/i,
    /just is/i,
    /it's like that/i,
    /^(yes|no|ok|okay)$/i
  ];

  const isVague = vaguePatterns.some(pattern => pattern.test(text)) || text.trim().length < 10;

  if (!isVague) {
    return { isVague: false, nudge: null };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `The participant gave a vague answer. Ask them to describe a situation, moment, or context where this is visible. Keep tone supportive. Keep it under 20 words.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.7
    });

    return {
      isVague: true,
      nudge: completion.choices[0].message.content.trim()
    };
  } catch (error) {
    console.error('Error generating vagueness nudge:', error);
    return {
      isVague: true,
      nudge: "Can you describe a specific situation or moment when you noticed this?"
    };
  }
}

/**
 * Suggest theme clusters for a set of nodes
 * @param {Array} nodes - Array of node objects with text
 * @returns {Promise<Object>} Suggested clusters
 */
async function suggestClusters(nodes) {
  if (nodes.length < 5) {
    return { clusters: [] };
  }

  try {
    const nodeTexts = nodes.map(n => n.text).join('\n- ');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are helping a facilitator cluster causes from a "causality garden" exercise.
I will give you a list of node texts.
Group them into 4–7 themes.
Prefer these names if appropriate: Identity, Environment, Growth, Security, Relationships, Health/Wellbeing.
If none fit, propose a new, short name.
Return JSON in the form {"clusters": [{"label": "string", "description": "string", "node_indices": [numbers]}]}.
Do not rewrite texts. Use the index position (0-based) to reference nodes.`
        },
        {
          role: 'user',
          content: `- ${nodeTexts}`
        }
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('Error suggesting clusters:', error);
    return { clusters: [] };
  }
}

/**
 * Generate a reflection summary for the session
 * @param {Object} session - Session object with nodes and clusters
 * @returns {Promise<string>} Reflection summary
 */
async function generateReflection(session) {
  try {
    const nodes = session.nodes || [];
    const clusters = session.clusters || [];
    
    const summary = {
      total_nodes: nodes.length,
      clusters: clusters.map(c => ({
        label: c.label,
        node_count: nodes.filter(n => n.cluster_id === c.id).length
      })),
      sample_nodes: nodes.slice(0, 10).map(n => n.text)
    };

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are helping a facilitator summarize a causality garden workshop.
Generate a brief reflection (3-4 sentences) that:
1. Identifies the main themes that emerged
2. Notes any patterns or tensions
3. Suggests a plausible next step or area of focus
Keep it supportive and insight-oriented.`
        },
        {
          role: 'user',
          content: JSON.stringify(summary)
        }
      ],
      temperature: 0.7
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating reflection:', error);
    return "This session explored multiple interconnected themes. Consider reviewing the clusters to identify which area feels most important to address next.";
  }
}

module.exports = {
  analyzeResponse,
  generateFollowUp,
  checkVagueness,
  suggestClusters,
  generateReflection
};
