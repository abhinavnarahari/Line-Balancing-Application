package com.qtech.linebalancing.chatbot;

import com.qtech.linebalancing.chatbot.assistant.GroundedAssistant;
import com.qtech.linebalancing.chatbot.assistant.nlu.Intent;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Held-out paraphrases (different wording from the golden set) to catch over-fitting of the routing rules.
 * Checks the intent only; the golden suite checks the figures. Requires the local sample dataset.
 */
@SpringBootTest
@Transactional
class SewNexaAiHeldOutTest {

    @Autowired private GroundedAssistant ai;

    @Test
    void paraphrasesRouteToTheRightIntent() {
        Map<String, Intent> cases = new LinkedHashMap<>();
        cases.put("total number of workers in the factory", Intent.OPERATOR_COUNT);
        cases.put("how many people work in packing", Intent.OPERATOR_COUNT);
        cases.put("give me the names of all quality checkers", Intent.OPERATOR_LIST);
        cases.put("who works in sewing line 2", Intent.OPERATOR_LIST);
        cases.put("EMP-007 details", Intent.OPERATOR_PROFILE);
        cases.put("which operators are expert in collar set", Intent.TOP_OPERATORS_FOR_OPERATION);
        cases.put("who can do bottom hem best", Intent.TOP_OPERATORS_FOR_OPERATION);
        cases.put("who is absent today", Intent.ATTENDANCE_SUMMARY);
        cases.put("attendance yesterday", Intent.ATTENDANCE_SUMMARY);
        cases.put("standard minutes for placket set", Intent.OPERATION_DETAILS);
        cases.put("op-009 smv", Intent.OPERATION_DETAILS);
        cases.put("show all operations", Intent.OPERATION_LIST);
        cases.put("which operations use flatlock", Intent.OPERATION_LIST);
        cases.put("STY-CREW-101 buyer", Intent.STYLE_DETAILS);
        cases.put("what styles do we make for tommy", Intent.STYLE_LIST);
        cases.put("tell me about LINE-02", Intent.LINE_DETAILS);
        cases.put("list sewing lines", Intent.LINE_LIST);
        cases.put("how many overlock machines are there", Intent.MACHINE_INVENTORY);
        cases.put("machines on line 2", Intent.MACHINE_INVENTORY);
        cases.put("what time does the C shift end", Intent.SHIFT_INFO);
        cases.put("break duration of general shift", Intent.SHIFT_INFO);
        cases.put("operations in OB-POLO-201", Intent.BULLETIN_DETAILS);
        cases.put("show all bulletins", Intent.BULLETIN_LIST);
        cases.put("what output can 12 operators give on OB-POLO-201", Intent.LINE_BALANCE_CALC);
        cases.put("manpower required for 100 pcs per hour for STY-CREW-101", Intent.LINE_BALANCE_CALC);
        cases.put("capacity plan for PO-2026-002", Intent.CAPACITY_PLAN);
        cases.put("define pitch time", Intent.FORMULA_EXPLAIN);
        cases.put("is PO-2026-001 on track for delivery", Intent.ORDER_STATUS);
        cases.put("how many pieces are pending for PO-2026-002", Intent.ORDER_STATUS);
        cases.put("show all orders", Intent.ORDER_LIST);
        cases.put("what was the output yesterday", Intent.PRODUCTION_SUMMARY);
        cases.put("rejects today", Intent.PRODUCTION_SUMMARY);
        cases.put("any unread notifications", Intent.ALERTS);
        cases.put("where do I add a new style", Intent.HOW_TO);
        cases.put("what can you do", Intent.GREETING);
        cases.put("write me a poem about the sea", Intent.OUT_OF_SCOPE);
        cases.put("what is the capital of france", Intent.OUT_OF_SCOPE);

        List<String> wrong = new ArrayList<>();
        cases.forEach((q, expected) -> {
            Intent got = ai.ask(q, null, null).intent();
            if (got != expected) wrong.add(q + " -> " + got + " (expected " + expected + ")");
        });
        System.out.printf("%nHeld-out routing accuracy: %d/%d%n%s%n", cases.size() - wrong.size(), cases.size(), String.join("\n", wrong));
        assertThat(wrong).isEmpty();
    }

    @org.springframework.beans.factory.annotation.Autowired
    private com.qtech.linebalancing.chatbot.assistant.skills.HelpSkill helpSkill;

    /** Every prompt the chat UI offers (starter cards, quick chips, slash commands) must get a real answer. */
    @Test
    void everyBuiltInPromptIsAnswered() {
        List<String> prompts = new ArrayList<>(List.of(
                // quick chips and slash commands in frontend/src/features/chatbot (ChatbotDrawer, ChatInput)
                "How does this application work?", "How do I balance a line in this app?", "How does the 1–5 Skill Matrix work?",
                "How do I add an operator?", "List operation bulletins", "How do I use the dashboards?",
                "How do I deploy floaters to bottlenecks?", "How to create a style and purchase orders?", "Show me all lines",
                "What are the features of SewNexa?"));
        helpSkill.starterQuestions().forEach(c -> prompts.addAll(c.prompts()));

        List<String> unanswered = new ArrayList<>();
        for (String p : prompts) {
            var r = ai.ask(p, null, null);
            boolean answered = r.intent() != Intent.UNKNOWN && r.intent() != Intent.OUT_OF_SCOPE
                    // attendance, production and alerts can truthfully be empty (e.g. a fresh database): that is still an answer
                    && (r.answer().dataAvailable() || r.intent() == Intent.ATTENDANCE_SUMMARY || r.intent() == Intent.PRODUCTION_SUMMARY
                        || r.intent() == Intent.ALERTS);
            if (!answered) unanswered.add(p + " -> " + r.intent() + ": " + r.answer().text().replaceAll("\\s+", " "));
        }
        System.out.printf("%nBuilt-in prompts answered: %d/%d%n%s%n", prompts.size() - unanswered.size(), prompts.size(), String.join("\n", unanswered));
        assertThat(unanswered).isEmpty();
    }
}
