package com.qtech.linebalancing.chatbot.assistant.skills;

import com.qtech.linebalancing.chatbot.assistant.Answer;
import com.qtech.linebalancing.chatbot.assistant.nlu.AnalyzedQuestion;
import com.qtech.linebalancing.chatbot.assistant.nlu.Intent;

import java.util.Set;

/**
 * Answers one family of intents from application data only. Implementations must be read-only and must never
 * produce a figure that was not computed from the database (no defaults presented as facts).
 */
public interface Skill {

    Set<Intent> intents();

    Answer answer(AnalyzedQuestion question);
}
