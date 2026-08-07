// Rule-based intent classification.
//
// Rules rather than a model call, for three reasons: it costs nothing, it is
// deterministic enough to test exactly, and a classifier that is itself an LLM
// call is steerable by the very input it is classifying. `IntentClassifier` keeps
// the door open for a model-backed version later, behind the same interface.
//
// Rules are ordered by consequence. The write check runs first because
// mistakenly treating a write as a question is merely unhelpful, while the
// reverse would let a mutating plan through with the wrong guard rails.

import type { Intent, IntentClassifier, IntentInput } from "./types";

/** Verbs that indicate the user wants something changed, sent or created. */
const WRITE_PATTERNS =
  /\b(create|add|update|edit|change|delete|remove|send|email|schedule|book|assign|invoice|draft|generate|write)\b/i;

/** Verbs that indicate reading a system of record, as opposed to general knowledge. */
const READ_PATTERNS =
  /\b(list|show|find|look ?up|get|fetch|open|check|search|who|which|status of)\b/i;

const SUMMARIZE_PATTERNS = /\b(summari[sz]e|recap|tl;?dr|key points|brief me)\b/i;

/** Phrasing that points at documents rather than at records. */
const RETRIEVAL_PATTERNS =
  /\b(documentation|docs|policy|guide|handbook|spec|specification|according to|what does .* say)\b/i;

const QUESTION_PATTERNS = /\?|^\s*(what|why|how|when|where|can|does|is|are|should)\b/i;

/** Conversational filler with no task in it. */
const SMALL_TALK = /^\s*(hi|hey|hello|thanks|thank you|ok|okay|got it|nice|cool|yes|no)\b[\s.!]*$/i;

export class RuleBasedIntentClassifier implements IntentClassifier {
  async classify(input: IntentInput): Promise<Intent> {
    const text = input.text.trim();

    if (text === "") {
      return { id: "unsupported", confidence: 1, rationale: "empty input" };
    }

    if (SMALL_TALK.test(text)) {
      return { id: "conversation", confidence: 0.9, rationale: "small talk" };
    }

    if (WRITE_PATTERNS.test(text)) {
      return { id: "write_action", confidence: 0.7, rationale: "mutating verb" };
    }

    if (SUMMARIZE_PATTERNS.test(text)) {
      return { id: "summarize", confidence: 0.8, rationale: "summarisation request" };
    }

    if (RETRIEVAL_PATTERNS.test(text)) {
      return { id: "retrieval", confidence: 0.7, rationale: "reference to documents" };
    }

    if (READ_PATTERNS.test(text)) {
      return { id: "read_action", confidence: 0.6, rationale: "record lookup verb" };
    }

    if (QUESTION_PATTERNS.test(text)) {
      return { id: "question", confidence: 0.6, rationale: "interrogative form" };
    }

    // A short unmatched message mid-conversation is almost always a follow-up;
    // the same text with no history is more likely a task stated tersely.
    return input.hasHistory && text.length < 40
      ? { id: "conversation", confidence: 0.5, rationale: "short follow-up" }
      : { id: "question", confidence: 0.3, rationale: "default" };
  }
}

export const ruleBasedIntentClassifier: IntentClassifier = new RuleBasedIntentClassifier();
